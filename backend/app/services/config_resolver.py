"""Resolve API keys from DB (encrypted) → .env fallback → None.

Resolution priority:
    org_api_keys (if org context active)
    → user_api_keys (legacy, if user context active)
    → instance_settings
    → .env
"""

import contextvars
import logging
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import InstanceSettings, UserApiKey, OrgApiKey
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
    """Get a key value.

    Resolution order:
        1. org_api_keys (if org context is active)
        2. user_api_keys (legacy, if user context is active)
        3. instance_settings
        4. .env
    """
    # Try org-level key first
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

    # Try user-level key (legacy fallback)
    uid = _current_user_id.get()
    if uid:
        row = db.query(UserApiKey).filter(
            UserApiKey.user_id == uid, UserApiKey.key_name == key_name
        ).first()
        if row:
            try:
                return decrypt(row.encrypted_value)
            except Exception:
                logger.warning(f"Failed to decrypt user key {key_name} for {uid}")

    # Try instance-level DB
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
    """Get all resolved keys (user + DB + env merged). Returns {key_name: value}.

    When a user context is active, user keys take highest priority.
    """
    result = {}
    settings = get_settings()

    # Load all instance DB rows at once
    db_rows = {r.key: r.encrypted_value for r in db.query(InstanceSettings).all()}

    for key_name in ALL_KEY_NAMES:
        # Try instance DB first
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

    # Override with user-specific keys (legacy)
    uid = _current_user_id.get()
    if uid:
        user_rows = db.query(UserApiKey).filter(UserApiKey.user_id == uid).all()
        for row in user_rows:
            try:
                result[row.key_name] = decrypt(row.encrypted_value)
            except Exception:
                logger.warning(f"Failed to decrypt user key {row.key_name} for {uid}")

    # Override with org-specific keys (highest priority)
    oid = _current_org_id.get()
    if oid:
        org_rows = db.query(OrgApiKey).filter(OrgApiKey.org_id == oid).all()
        for row in org_rows:
            try:
                result[row.key_name] = decrypt(row.encrypted_value)
            except Exception:
                logger.warning(f"Failed to decrypt org key {row.key_name} for org {oid}")

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

    Checks org keys (highest), then user keys (legacy), then instance, then env.
    """
    settings = get_settings()
    db_keys = {r.key for r in db.query(InstanceSettings).all()}

    # Include org keys when context is set
    oid = _current_org_id.get()
    org_keys: set[str] = set()
    if oid:
        org_keys = {r.key_name for r in db.query(OrgApiKey).filter(OrgApiKey.org_id == oid).all()}

    # Include user keys (legacy) when context is set
    uid = _current_user_id.get()
    user_keys: set[str] = set()
    if uid:
        user_keys = {r.key_name for r in db.query(UserApiKey).filter(UserApiKey.user_id == uid).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in org_keys:
                keys_status[key_name] = {"status": "set", "source": "org"}
            elif key_name in user_keys:
                keys_status[key_name] = {"status": "set", "source": "user"}
            elif key_name in db_keys:
                keys_status[key_name] = {"status": "set", "source": "db"}
            elif getattr(settings, key_name, None):
                keys_status[key_name] = {"status": "set", "source": "env"}
            else:
                keys_status[key_name] = {"status": "missing", "source": None}

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
# Per-user key functions (fallback: user → instance → .env)
# ---------------------------------------------------------------------------


def get_user_key(db: Session, user_id: str, key_name: str) -> str | None:
    """Get a key for a specific user. Falls back to instance key, then .env."""
    row = db.query(UserApiKey).filter(
        UserApiKey.user_id == user_id, UserApiKey.key_name == key_name
    ).first()
    if row:
        try:
            return decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt user key {key_name} for {user_id}")
    # Fallback to instance-level
    return get_key(db, key_name)


def get_all_user_keys(db: Session, user_id: str) -> dict[str, str]:
    """Get all resolved keys for a user. User keys override instance/env keys."""
    # Start with instance + env as base
    result = get_all_keys(db)

    # Override with user-specific keys
    user_rows = db.query(UserApiKey).filter(UserApiKey.user_id == user_id).all()
    for row in user_rows:
        try:
            result[row.key_name] = decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt user key {row.key_name} for {user_id}")

    return result


def set_user_key(db: Session, user_id: str, key_name: str, value: str) -> None:
    """Encrypt and upsert a key for a specific user."""
    encrypted = encrypt(value)
    row = db.query(UserApiKey).filter(
        UserApiKey.user_id == user_id, UserApiKey.key_name == key_name
    ).first()
    if row:
        row.encrypted_value = encrypted
    else:
        row = UserApiKey(user_id=user_id, key_name=key_name, encrypted_value=encrypted)
        db.add(row)
    db.commit()


def delete_user_key(db: Session, user_id: str, key_name: str) -> bool:
    """Delete a user's key. Returns True if deleted, False if not found."""
    row = db.query(UserApiKey).filter(
        UserApiKey.user_id == user_id, UserApiKey.key_name == key_name
    ).first()
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def get_user_status(db: Session, user_id: str) -> dict:
    """Get status of all providers for a specific user.

    Source priority: "user" (user_api_keys) → "db" (instance_settings) → "env" (.env)
    """
    settings = get_settings()

    # Load user keys and instance keys
    user_keys = {r.key_name for r in db.query(UserApiKey).filter(UserApiKey.user_id == user_id).all()}
    instance_keys = {r.key for r in db.query(InstanceSettings).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in user_keys:
                keys_status[key_name] = {"status": "set", "source": "user"}
            elif key_name in instance_keys:
                keys_status[key_name] = {"status": "set", "source": "db"}
            elif getattr(settings, key_name, None):
                keys_status[key_name] = {"status": "set", "source": "env"}
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


# ---------------------------------------------------------------------------
# Per-org key functions (org → instance → .env)
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
    """Get all resolved keys for an org. Org keys override instance/env keys."""
    # Start with instance + env as base
    result = {}
    settings = get_settings()

    # Load all instance DB rows at once
    db_rows = {r.key: r.encrypted_value for r in db.query(InstanceSettings).all()}

    for key_name in ALL_KEY_NAMES:
        # Try instance DB first
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

    # Override with org-specific keys (highest priority)
    org_rows = db.query(OrgApiKey).filter(OrgApiKey.org_id == org_id).all()
    for row in org_rows:
        try:
            result[row.key_name] = decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt org key {row.key_name} for org {org_id}")

    return result


def get_org_key(db: Session, org_id: str, key_name: str) -> str | None:
    """Get a key for a specific org. Falls back to instance key, then .env."""
    row = db.query(OrgApiKey).filter(
        OrgApiKey.org_id == org_id, OrgApiKey.key_name == key_name
    ).first()
    if row:
        try:
            return decrypt(row.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt org key {key_name} for org {org_id}")
    # Fallback to instance-level (no user/org context)
    inst = db.query(InstanceSettings).filter(InstanceSettings.key == key_name).first()
    if inst:
        try:
            return decrypt(inst.encrypted_value)
        except Exception:
            pass
    settings = get_settings()
    val = getattr(settings, key_name, None)
    return val if val else None


def get_org_status(db: Session, org_id: str) -> dict:
    """Get status of all providers for a specific organization.

    Source priority: "org" (org_api_keys) → "db" (instance_settings) → "env" (.env)
    """
    settings = get_settings()

    # Load org keys and instance keys
    org_keys = {r.key_name for r in db.query(OrgApiKey).filter(OrgApiKey.org_id == org_id).all()}
    instance_keys = {r.key for r in db.query(InstanceSettings).all()}

    result = {"providers": {}, "all_required_set": True}

    for provider_id, provider in PROVIDERS.items():
        keys_status = {}
        for key_name in provider["keys"]:
            if key_name in org_keys:
                keys_status[key_name] = {"status": "set", "source": "org"}
            elif key_name in instance_keys:
                keys_status[key_name] = {"status": "set", "source": "db"}
            elif getattr(settings, key_name, None):
                keys_status[key_name] = {"status": "set", "source": "env"}
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
