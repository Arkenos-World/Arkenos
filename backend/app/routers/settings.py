"""Settings router — manage instance-level API keys."""

import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.config_resolver import (
    get_all_keys,
    get_key,
    get_status,
    set_key,
    PROVIDERS,
    ALL_KEY_NAMES,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Schemas ---


class KeySave(BaseModel):
    key_name: str
    value: str


class BulkKeySave(BaseModel):
    keys: dict[str, str]


class TestRequest(BaseModel):
    keys: Optional[dict[str, str]] = None  # Optional override keys to test with


class TestResult(BaseModel):
    provider: str
    success: bool
    message: str


# --- Endpoints ---


@router.get("/instance-id")
async def get_instance_id(db: Session = Depends(get_db)):
    """Public endpoint: returns the unique instance ID for telemetry."""
    from app.models import InstanceSettings
    row = db.query(InstanceSettings).filter(InstanceSettings.key == "instance_id").first()
    if not row:
        raise HTTPException(status_code=404, detail="Instance ID not found")
    return {"instance_id": row.encrypted_value}


@router.get("/keys")
async def get_key_status(db: Session = Depends(get_db)):
    """Get status of all API keys (set/missing, source). Never returns actual values."""
    return get_status(db)


@router.post("/keys")
async def save_key(data: KeySave, db: Session = Depends(get_db)):
    """Save a single API key (encrypted)."""
    if data.key_name not in ALL_KEY_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown key: {data.key_name}")
    set_key(db, data.key_name, data.value)
    # Clear SIP URI cache if a LiveKit key changed
    if data.key_name.startswith("livekit_"):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
    return {"status": "saved", "key": data.key_name}


@router.post("/keys/bulk")
async def save_keys_bulk(data: BulkKeySave, db: Session = Depends(get_db)):
    """Save multiple API keys at once."""
    saved = []
    for key_name, value in data.keys.items():
        if key_name not in ALL_KEY_NAMES:
            continue
        if value:  # Skip empty strings
            set_key(db, key_name, value)
            saved.append(key_name)
    # Clear SIP URI cache if any LiveKit key changed
    if any(k.startswith("livekit_") for k in saved):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
    return {"status": "saved", "keys": saved}


@router.delete("/keys/{key_name}")
async def delete_key(key_name: str, db: Session = Depends(get_db)):
    """Delete a key from the DB. Falls back to .env if one exists."""
    if key_name not in ALL_KEY_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown key: {key_name}")
    from app.models import InstanceSettings
    row = db.query(InstanceSettings).filter(InstanceSettings.key == key_name).first()
    if not row:
        raise HTTPException(status_code=404, detail="Key not found in dashboard")
    db.delete(row)
    db.commit()
    if key_name.startswith("livekit_"):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
    return {"status": "deleted", "key": key_name}


@router.get("/keys/agent")
async def get_agent_keys(db: Session = Depends(get_db)):
    """Internal endpoint: returns all decrypted keys for agent boot."""
    return get_all_keys(db)


@router.post("/test/{provider}", response_model=TestResult)
async def test_provider_connection(
    provider: str,
    body: Optional[TestRequest] = None,
    db: Session = Depends(get_db),
):
    """Test connection to a provider.

    If body.keys is provided, those values are used instead of DB/env keys.
    This allows testing new keys before saving them.
    """
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    # Build a key resolver that checks body overrides first
    override_keys = (body.keys if body else None) or {}

    def resolve_key(key_name: str) -> str | None:
        if key_name in override_keys and override_keys[key_name]:
            return override_keys[key_name]
        return get_key(db, key_name)

    testers = {
        "livekit": _test_livekit,
        "google": _test_google,
        "resemble": _test_resemble,
        "assemblyai": _test_assemblyai,
        "deepgram": _test_deepgram,
        "elevenlabs": _test_elevenlabs,
        "twilio": _test_twilio,
        "telnyx": _test_telnyx,
    }

    tester = testers.get(provider)
    if not tester:
        return TestResult(provider=provider, success=False, message="No test available")

    try:
        return await tester(resolve_key)
    except Exception as e:
        logger.warning(f"Test connection failed for {provider}: {e}")
        return TestResult(provider=provider, success=False, message=str(e))


# --- Test Connection Functions ---
# Each takes a resolve_key(name) callable that returns the key value or None.


async def _test_livekit(resolve_key) -> TestResult:
    api_key = resolve_key("livekit_api_key")
    api_secret = resolve_key("livekit_api_secret")
    url = resolve_key("livekit_url")
    if not all([api_key, api_secret, url]):
        return TestResult(provider="livekit", success=False, message="Missing LiveKit credentials")

    from livekit.api import LiveKitAPI

    lk = LiveKitAPI(url=url, api_key=api_key, api_secret=api_secret)
    try:
        from livekit.api import ListRoomsRequest
        await lk.room.list_rooms(ListRoomsRequest())
        return TestResult(provider="livekit", success=True, message="Connected to LiveKit")
    finally:
        await lk.aclose()


async def _test_google(resolve_key) -> TestResult:
    api_key = resolve_key("google_api_key")
    if not api_key:
        return TestResult(provider="google", success=False, message="Missing Google API key")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://generativelanguage.googleapis.com/v1/models",
            params={"key": api_key},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="google", success=True, message="Google AI API key is valid")
    return TestResult(provider="google", success=False, message=f"Google API returned {resp.status_code}")


async def _test_resemble(resolve_key) -> TestResult:
    api_key = resolve_key("resemble_api_key")
    if not api_key:
        return TestResult(provider="resemble", success=False, message="Missing Resemble API key")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://app.resemble.ai/api/v2/projects",
            headers={"Authorization": f"Token {api_key}"},
            params={"page": 1},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="resemble", success=True, message="Resemble AI API key is valid")
    return TestResult(provider="resemble", success=False, message=f"Resemble API returned {resp.status_code}")


async def _test_assemblyai(resolve_key) -> TestResult:
    api_key = resolve_key("assemblyai_api_key")
    if not api_key:
        return TestResult(provider="assemblyai", success=False, message="Missing AssemblyAI API key")

    async with httpx.AsyncClient() as client:
        # /v2/account returns 200 even for bad keys; use /v2/transcript instead
        resp = await client.get(
            "https://api.assemblyai.com/v2/transcript",
            params={"limit": "1"},
            headers={"Authorization": api_key},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="assemblyai", success=True, message="AssemblyAI API key is valid")
    return TestResult(provider="assemblyai", success=False, message=f"AssemblyAI returned {resp.status_code}: Invalid API key")


async def _test_deepgram(resolve_key) -> TestResult:
    api_key = resolve_key("deepgram_api_key")
    if not api_key:
        return TestResult(provider="deepgram", success=False, message="Missing Deepgram API key")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.deepgram.com/v1/projects",
            headers={"Authorization": f"Token {api_key}"},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="deepgram", success=True, message="Deepgram API key is valid")
    return TestResult(provider="deepgram", success=False, message=f"Deepgram returned {resp.status_code}")


async def _test_elevenlabs(resolve_key) -> TestResult:
    api_key = resolve_key("elevenlabs_api_key")
    if not api_key:
        return TestResult(provider="elevenlabs", success=False, message="Missing ElevenLabs API key")

    async with httpx.AsyncClient() as client:
        # /v1/user requires user_read permission; /v1/voices works with basic keys
        resp = await client.get(
            "https://api.elevenlabs.io/v1/voices",
            headers={"xi-api-key": api_key},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="elevenlabs", success=True, message="ElevenLabs API key is valid")
    return TestResult(provider="elevenlabs", success=False, message=f"ElevenLabs returned {resp.status_code}")


async def _test_twilio(resolve_key) -> TestResult:
    sid = resolve_key("twilio_account_sid")
    token = resolve_key("twilio_auth_token")
    if not all([sid, token]):
        return TestResult(provider="twilio", success=False, message="Missing Twilio credentials")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}.json",
            auth=(sid, token),
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="twilio", success=True, message="Twilio credentials are valid")
    return TestResult(provider="twilio", success=False, message=f"Twilio returned {resp.status_code}")


async def _test_telnyx(resolve_key) -> TestResult:
    api_key = resolve_key("telnyx_api_key")
    if not api_key:
        return TestResult(provider="telnyx", success=False, message="Missing Telnyx API key")

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.telnyx.com/v2/balance",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=10,
        )
    if resp.status_code == 200:
        return TestResult(provider="telnyx", success=True, message="Telnyx API key is valid")
    return TestResult(provider="telnyx", success=False, message=f"Telnyx returned {resp.status_code}")
