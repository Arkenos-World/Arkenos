import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from livekit.api import AccessToken, VideoGrants
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.services.config_resolver import get_key, require_providers
from app.models import CallStatus, SessionStatus, VoiceSession
from app.schemas import TokenRequest, TokenResponse

logger = logging.getLogger("livekit_webhook")
router = APIRouter()


def _update_call_status(room_name: str, status: CallStatus, end: bool = False) -> None:
    """Update VoiceSession call status by room name. Uses its own DB session."""
    db = SessionLocal()
    try:
        session = db.query(VoiceSession).filter(VoiceSession.room_name == room_name).first()
        if not session:
            logger.debug(f"No session found for room {room_name}")
            return

        session.call_status = status
        if end:
            session.status = SessionStatus.COMPLETED
            session.ended_at = datetime.utcnow()
            if session.started_at:
                session.duration = int((session.ended_at - session.started_at).total_seconds())

        db.commit()
        logger.info(f"Updated session {session.id} call_status={status.value} end={end}")
    except Exception:
        logger.exception(f"Failed to update call status for room {room_name}")
        db.rollback()
    finally:
        db.close()


@router.post("/token", response_model=TokenResponse)
async def generate_token(
    request: TokenRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Generate a LiveKit access token for a user to join a room."""
    lk_api_key = get_key(db, "livekit_api_key")
    lk_api_secret = get_key(db, "livekit_api_secret")
    lk_url = get_key(db, "livekit_url")

    token = AccessToken(
        api_key=lk_api_key,
        api_secret=lk_api_secret,
    )
    token.identity = request.user_id
    token.name = request.user_name or request.user_id
    token.ttl = 600  # 10 minutes

    token.add_grant(
        VideoGrants(
            room=request.room_name,
            room_join=True,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
        )
    )

    jwt_token = token.to_jwt()

    return TokenResponse(
        token=jwt_token,
        ws_url=lk_url,
        room_name=request.room_name,
    )


@router.post("/webhook")
async def livekit_webhook(event: dict):
    """Handle LiveKit webhook events and track SIP call status."""
    event_type = event.get("event")
    room_name = event.get("room", {}).get("name", "")

    match event_type:
        case "room_started":
            logger.info(f"Room started: {room_name}")
        case "room_finished":
            logger.info(f"Room finished: {room_name}")
            _update_call_status(room_name, CallStatus.COMPLETED, end=True)
        case "participant_joined":
            identity = event.get("participant", {}).get("identity", "")
            logger.info(f"Participant joined: {identity} in {room_name}")
            # Detect SIP participant (phone caller) answering
            if identity.startswith("sip_") or identity.startswith("phone-") or identity.startswith("+"):
                _update_call_status(room_name, CallStatus.ANSWERED)
        case "participant_left":
            identity = event.get("participant", {}).get("identity", "")
            logger.info(f"Participant left: {identity} in {room_name}")
        case _:
            logger.debug(f"Unhandled webhook event: {event_type}")

    return {"status": "ok"}
