"""Resolve API keys from DB (encrypted) → .env fallback → None."""

import logging
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import InstanceSettings
from app.services.encryption import encrypt, decrypt

logger = logging.getLogger(__name__)

# All managed keys grouped by provider
PROVIDERS = {
    "livekit": {
        "label": "LiveKit",
        "keys": ["livekit_api_key", "livekit_api_secret", "livekit_url"],
        "required": True,
    },
    "google": {
        "label": "Google AI (Gemini)",
        "keys": ["google_api_key"],
        "required": True,
    },
    "resemble": {
        "label": "Resemble AI",
        "keys": ["resemble_api_key"],
        "required": True,
    },
    "assemblyai": {
        "label": "AssemblyAI",
        "keys": ["assemblyai_api_key"],
        "required": False,  # At least one STT required
    },
    "deepgram": {
        "label": "Deepgram",
        "keys": ["deepgram_api_key"],
        "required": False,
    },
    "elevenlabs": {
        "label": "ElevenLabs",
        "keys": ["elevenlabs_api_key"],
        "required": False,
    },
    "twilio": {
        "label": "Twilio",
        "keys": ["twilio_account_sid", "twilio_auth_token"],
        "required": True,
    },
}

# Flat set of all key names we manage
ALL_KEY_NAMES = {k for p in PROVIDERS.values() for k in p["keys"]}


def require_providers(*provider_ids: str):
    """FastAPI dependency — raises 400 if any listed provider is not configured."""
    def checker(db: Session = Depends(get_db)):
        status = get_status(db)
        missing = [
            PROVIDERS[pid]["label"]
            for pid in provider_ids
            if not status["providers"].get(pid, {}).get("configured")
        ]
        if missing:
            raise HTTPException(
                400,
                detail=f"Missing API keys: {', '.join(missing)}. Configure at Settings > API Keys.",
            )
    return checker


def get_key(db: Session, key_name: str) -> str | None:
    """Get a key value: DB first, then .env fallback."""
    # Try DB
    row = db.query(InstanceSettings).filter(InstanceSettings.key == key_name).first()
    if row:
        try:
            return decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt key {key_name} from DB, falling back to env")

    # Fallback to .env
    settings = get_settings()
    val = getattr(settings, key_name, None)
    return val if val else None


def get_all_keys(db: Session) -> dict[str, str]:
    """Get all resolved keys (DB + env merged). Returns {key_name: value}."""
    result = {}
    settings = get_settings()

    # Load all DB rows at once
    db_rows = {r.key: r.encrypted_value for r in db.query(InstanceSettings).all()}

    for key_name in ALL_KEY_NAMES:
        # Try DB first
        if key_name in db_rows:
            try:
                result[key_name] = decrypt(db_rows[key_name])
                continue
            except Exception:
                logger.warning(f"Failed to decrypt {key_name}")

        # Fallback to env
        val = getattr(settings, key_name, None)
        if val:
            result[key_name] = val

    return result


def set_key(db: Session, key_name: str, value: str) -> None:
    """Encrypt and upsert a key into the DB."""
    encrypted = encrypt(value)
    row = db.query(InstanceSettings).filter(InstanceSettings.key == key_name).first()
    if row:
        row.encrypted_value = encrypted
    else:
        row = InstanceSettings(key=key_name, encrypted_value=encrypted)
        db.add(row)
    db.commit()


def get_status(db: Session) -> dict:
    """Get status of all providers and their keys.

    Returns:
        {
            "providers": {
                "livekit": {
                    "label": "LiveKit",
                    "required": True,
                    "keys": {
                        "livekit_api_key": {"status": "set", "source": "db"},
                        "livekit_api_secret": {"status": "missing", "source": null},
                    }
                },
                ...
            },
            "all_required_set": True/False
        }
    """
    settings = get_settings()
    db_keys = {r.key for r in db.query(InstanceSettings).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in db_keys:
                keys_status[key_name] = {"status": "set", "source": "db"}
            elif getattr(settings, key_name, None):
                keys_status[key_name] = {"status": "set", "source": "env"}
            else:
                keys_status[key_name] = {"status": "missing", "source": None}

        # Check if this provider is fully configured
        all_set = all(k["status"] == "set" for k in keys_status.values())

        result["providers"][provider_id] = {
            "label": provider["label"],
            "required": provider["required"],
            "configured": all_set,
            "keys": keys_status,
        }

        if provider["required"] and not all_set:
            result["all_required_set"] = False

    # Special: at least one STT provider must be configured
    stt_providers = ["assemblyai", "deepgram", "elevenlabs"]
    stt_configured = any(result["providers"][p]["configured"] for p in stt_providers)
    result["stt_configured"] = stt_configured
    if not stt_configured:
        result["all_required_set"] = False

    return result
