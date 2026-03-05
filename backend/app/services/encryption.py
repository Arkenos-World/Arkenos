"""AES-256-GCM encryption for API keys stored in the database.

The encryption key is auto-generated on first boot and stored in the
`instance_settings` table (key = '_encryption_key'). Zero config needed.
"""

import base64
import os
import secrets

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_cached_key: bytes | None = None


def _get_aes_key() -> bytes:
    """Get the 32-byte AES key. Auto-generates and stores in DB on first use."""
    global _cached_key
    if _cached_key:
        return _cached_key

    from app.database import SessionLocal
    from app.models import InstanceSettings

    db = SessionLocal()
    try:
        row = db.query(InstanceSettings).filter(
            InstanceSettings.key == "_encryption_key"
        ).first()

        if row:
            _cached_key = base64.urlsafe_b64decode(
                row.encrypted_value + "=" * (-len(row.encrypted_value) % 4)
            )
        else:
            # First boot — generate and persist
            _cached_key = secrets.token_bytes(32)
            encoded = base64.urlsafe_b64encode(_cached_key).decode("ascii")
            new_row = InstanceSettings(key="_encryption_key", encrypted_value=encoded)
            db.add(new_row)
            db.commit()

        return _cached_key
    finally:
        db.close()


def encrypt(plaintext: str) -> str:
    """Encrypt a string with AES-256-GCM. Returns base64(nonce + ciphertext + tag)."""
    key = _get_aes_key()
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt(encrypted: str) -> str:
    """Decrypt base64(nonce + ciphertext + tag) back to plaintext."""
    key = _get_aes_key()
    raw = base64.b64decode(encrypted)
    nonce, ciphertext = raw[:12], raw[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")
