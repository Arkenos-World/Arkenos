"""Settings router — manage per-org API keys with instance-level fallback."""

import asyncio
import json
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_org, get_current_user, require_role
from app.models import Organization, OrgMember, User
from app.services.config_resolver import (
    get_all_keys,
    get_all_org_keys,
    get_all_user_keys,
    get_key,
    get_org_key,
    get_org_status,
    get_user_key,
    get_user_status,
    set_org_key,
    delete_org_key,
    set_user_key,
    delete_user_key,
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


# --- Agent WebSocket for live config reload ---

_agent_connections: set[WebSocket] = set()


async def notify_agents(event_type: str, **kwargs):
    """Broadcast a message to all connected agent workers."""
    message = json.dumps({"type": event_type, **kwargs})
    dead = []
    for ws in _agent_connections:
        try:
            await ws.send_text(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        _agent_connections.discard(ws)


@router.websocket("/ws/agent")
async def agent_websocket(ws: WebSocket):
    """Persistent WebSocket for agent workers.

    Agents connect on startup and stay connected. Backend pushes config
    change notifications (e.g. livekit_keys_changed) so agents can
    react instantly without polling.
    """
    await ws.accept()
    _agent_connections.add(ws)
    logger.info(f"[WS] Agent connected ({len(_agent_connections)} total)")
    try:
        while True:
            # Keep connection alive — agent may send pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        pass
    finally:
        _agent_connections.discard(ws)
        logger.info(f"[WS] Agent disconnected ({len(_agent_connections)} total)")


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
async def get_key_status(
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Get status of all API keys for the current org. Never returns actual values."""
    return get_org_status(db, org.id)


@router.post("/keys", dependencies=[Depends(require_role("owner", "admin"))])
async def save_key(
    data: KeySave,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Save a single API key for the current org (encrypted)."""
    if data.key_name not in ALL_KEY_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown key: {data.key_name}")
    set_org_key(db, org.id, data.key_name, data.value)
    if data.key_name.startswith("livekit_"):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
        try:
            await notify_agents("livekit_keys_changed", key=data.key_name)
        except Exception as e:
            logger.warning(f"Failed to notify agents of key change: {e}")
    return {"status": "saved", "key": data.key_name}


@router.post("/keys/bulk", dependencies=[Depends(require_role("owner", "admin"))])
async def save_keys_bulk(
    data: BulkKeySave,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Save multiple API keys for the current org at once."""
    saved = []
    for key_name, value in data.keys.items():
        if key_name not in ALL_KEY_NAMES:
            continue
        if value:  # Skip empty strings
            set_org_key(db, org.id, key_name, value)
            saved.append(key_name)
    if any(k.startswith("livekit_") for k in saved):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
        try:
            await notify_agents("livekit_keys_changed", keys=[k for k in saved if k.startswith("livekit_")])
        except Exception as e:
            logger.warning(f"Failed to notify agents of key change: {e}")
            logger.warning(f"Failed to notify agents of key change: {e}")
    return {"status": "saved", "keys": saved}


@router.delete("/keys/{key_name}", dependencies=[Depends(require_role("owner", "admin"))])
async def delete_key(
    key_name: str,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Delete an org's key from the DB. Falls back to instance/env if one exists."""
    if key_name not in ALL_KEY_NAMES:
        raise HTTPException(status_code=400, detail=f"Unknown key: {key_name}")
    deleted = delete_org_key(db, org.id, key_name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Key not found in dashboard")
    if key_name.startswith("livekit_"):
        from app.services.telephony_provisioning import clear_sip_uri_cache
        clear_sip_uri_cache()
    return {"status": "deleted", "key": key_name}


@router.get("/keys/agent")
async def get_agent_keys(
    db: Session = Depends(get_db),
    org_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
):
    """Internal endpoint: returns decrypted keys for agent/service use.

    Called by the agent process and frontend token route (server-to-server).
    Accepts ?org_id= (preferred) or ?user_id= (legacy backward compat).
    Should not be exposed to the public internet — protect via network/firewall.
    """
    # Prefer org_id if provided
    if org_id:
        org = db.query(Organization).filter(Organization.id == org_id).first()
        if org:
            return get_all_org_keys(db, org.id)

    # Legacy: resolve via user_id, then find user's org
    if user_id:
        from app.models import User as UserModel
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if not user:
            user = db.query(UserModel).filter(UserModel.auth_id == user_id).first()
        if user:
            # Try to find the user's org and return org keys
            membership = db.query(OrgMember).filter(OrgMember.user_id == user.id).first()
            if membership:
                return get_all_org_keys(db, membership.org_id)
            # Final fallback: legacy user keys
            return get_all_user_keys(db, user.id)

    # No org/user context — try to find LiveKit keys from any org so the
    # agent worker can register on startup without .env configuration.
    from app.models import OrgApiKey
    from app.services.encryption import decrypt

    base_keys = get_all_keys(db)

    # Check if base already has LiveKit keys (from instance_settings or .env)
    if base_keys.get("livekit_url") and base_keys.get("livekit_api_key"):
        return base_keys

    # Fall back to first org that has LiveKit keys configured
    lk_org_key = db.query(OrgApiKey).filter(
        OrgApiKey.key_name == "livekit_url"
    ).first()
    if lk_org_key:
        org_keys = get_all_org_keys(db, lk_org_key.org_id)
        # Merge: org keys fill gaps in base keys
        for k, v in org_keys.items():
            if v and not base_keys.get(k):
                base_keys[k] = v
        return base_keys

    return base_keys


@router.post("/test/{provider}", response_model=TestResult)
async def test_provider_connection(
    provider: str,
    body: Optional[TestRequest] = None,
    db: Session = Depends(get_db),
    org: Organization = Depends(get_current_org),
):
    """Test connection to a provider using the current org's keys.

    If body.keys is provided, those values are used instead of DB/env keys.
    This allows testing new keys before saving them.
    """
    if provider not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    # Build a key resolver that checks body overrides first, then org keys
    override_keys = (body.keys if body else None) or {}

    def resolve_key(key_name: str) -> str | None:
        if key_name in override_keys and override_keys[key_name]:
            return override_keys[key_name]
        return get_org_key(db, org.id, key_name)

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
