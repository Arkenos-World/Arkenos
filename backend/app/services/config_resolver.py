"""Resolve API keys from org_api_keys (encrypted).

All API keys are org-scoped. Users must configure keys after signup.
No fallback to instance_settings or .env for API keys.
instance_settings is only used for internal values (_encryption_key, instance_id).
"""

import contextvars
import logging
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OrgApiKey
from app.services.encryption import encrypt, decrypt

logger = logging.getLogger(__name__)

# Context variables set by middleware/dependencies per-request.
_current_user_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "_current_user_id", default=None
)
_current_org_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "_current_org_id", default=None
)

# All managed keys grouped by provider
PROVIDERS = {
    "livekit": {
        "label": "LiveKit",
        "keys": ["livekit_api_key", "livekit_api_secret", "livekit_url", "livekit_sip_uri"],
        "required": True,
        "optional_keys": ["livekit_sip_uri"],  # Not required for "configured" status
    },
    "google": {
        "label": "Google AI (Gemini)",
        "keys": ["google_api_key"],
        "required": True,
    },
    "zai": {
        "label": "Z.ai (GLM)",
        "keys": ["zai_api_key"],
        "required": False,
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
        "required": False,
    },
    "telnyx": {
        "label": "Telnyx",
        "keys": ["telnyx_api_key"],
        "required": False,
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
    """Get a key value from the current org context. Returns None if not set."""
    oid = _current_org_id.get()
    if oid:
        row = db.query(OrgApiKey).filter(
            OrgApiKey.org_id == oid, OrgApiKey.key_name == key_name
        ).first()
        if row:
            try:
                return decrypt(row.encrypted_value)
            except Exception:
                logger.warning(f"Failed to decrypt org key {key_name} for org {oid}")
    return None


def get_all_keys(db: Session) -> dict[str, str]:
    """Get all resolved keys for the current org context. Returns {key_name: value}."""
    result = {}
    oid = _current_org_id.get()
    if oid:
        org_rows = db.query(OrgApiKey).filter(OrgApiKey.org_id == oid).all()
        for row in org_rows:
            try:
                result[row.key_name] = decrypt(row.encrypted_value)
            except Exception:
                logger.warning(f"Failed to decrypt org key {row.key_name} for org {oid}")
    return result


def _mask_value(value: str | None) -> str | None:
    """Return a masked version of a key value, e.g. 'sk-proj...x7f2'."""
    if not value:
        return None
    v = value.strip()
    if len(v) <= 8:
        return v[:2] + "..." + v[-2:]
    return v[:6] + "..." + v[-4:]


def get_status(db: Session) -> dict:
    """Get status of all providers and their keys (org-scoped only)."""
    oid = _current_org_id.get()
    org_keys: set[str] = set()
    if oid:
        org_keys = {r.key_name for r in db.query(OrgApiKey).filter(OrgApiKey.org_id == oid).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in org_keys:
                keys_status[key_name] = {"status": "set", "source": "org", "masked_value": None}
            else:
                keys_status[key_name] = {"status": "missing", "source": None, "masked_value": None}

        # Check if this provider is fully configured (ignoring optional keys)
        optional_keys = set(provider.get("optional_keys", []))
        all_set = all(
            k["status"] == "set"
            for key_name, k in keys_status.items()
            if key_name not in optional_keys
        )

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

    # Special: at least one telephony provider must be configured
    telephony_providers = ["twilio", "telnyx"]
    telephony_configured = any(result["providers"][p]["configured"] for p in telephony_providers)
    result["telephony_configured"] = telephony_configured
    if not telephony_configured:
        result["all_required_set"] = False

    return result


# ---------------------------------------------------------------------------
# Per-org key functions (org-scoped only)
# ---------------------------------------------------------------------------


def set_org_key(db: Session, org_id: str, key_name: str, value: str) -> None:
    """Encrypt and upsert a key for a specific organization."""
    encrypted = encrypt(value)
    row = db.query(OrgApiKey).filter(
        OrgApiKey.org_id == org_id, OrgApiKey.key_name == key_name
    ).first()
    if row:
        row.encrypted_value = encrypted
    else:
        row = OrgApiKey(org_id=org_id, key_name=key_name, encrypted_value=encrypted)
        db.add(row)
    db.commit()


def delete_org_key(db: Session, org_id: str, key_name: str) -> bool:
    """Delete an org's key. Returns True if deleted, False if not found."""
    row = db.query(OrgApiKey).filter(
        OrgApiKey.org_id == org_id, OrgApiKey.key_name == key_name
    ).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def get_all_org_keys(db: Session, org_id: str) -> dict[str, str]:
    """Get all resolved keys for an org. Org keys only, no fallback."""
    result = {}
    org_rows = db.query(OrgApiKey).filter(OrgApiKey.org_id == org_id).all()
    for row in org_rows:
        try:
            result[row.key_name] = decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt org key {row.key_name} for org {org_id}")
    return result


def get_org_key(db: Session, org_id: str, key_name: str) -> str | None:
    """Get a key for a specific org. No fallback."""
    row = db.query(OrgApiKey).filter(
        OrgApiKey.org_id == org_id, OrgApiKey.key_name == key_name
    ).first()
    if row:
        try:
            return decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt org key {key_name} for org {org_id}")
    return None


def _mask_value(value: str) -> str:
    """Return last 4 characters of a key value, masked. E.g. '••••••ab3F'."""
    if not value or len(value) < 4:
        return "••••"
    return "••••••" + value[-4:]


def get_org_status(db: Session, org_id: str) -> dict:
    """Get status of all providers for a specific organization. Org keys only."""
    org_key_rows = {r.key_name: r.encrypted_value for r in db.query(OrgApiKey).filter(OrgApiKey.org_id == org_id).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in org_key_rows:
                hint = ""
                try:
                    hint = _mask_value(decrypt(org_key_rows[key_name]))
                except Exception:
                    hint = "••••••"
                keys_status[key_name] = {"status": "set", "source": "org", "hint": hint}
            else:
                keys_status[key_name] = {"status": "missing", "source": None}

        optional_keys = set(provider.get("optional_keys", []))
        all_set = all(
            k["status"] == "set"
            for key_name, k in keys_status.items()
            if key_name not in optional_keys
        )

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

    # Special: at least one telephony provider must be configured
    telephony_providers = ["twilio", "telnyx"]
    telephony_configured = any(result["providers"][p]["configured"] for p in telephony_providers)
    result["telephony_configured"] = telephony_configured
    if not telephony_configured:
        result["all_required_set"] = False

    return result
