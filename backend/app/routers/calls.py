"""
Calls Router - Outbound calling via LiveKit SIP.
Handles initiating outbound phone calls and tracking call status.
"""

import asyncio
import logging
import re
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.config_resolver import get_key, require_providers
from app.models import (
    Agent,
    CallDirection,
    CallStatus,
    SessionStatus,
    User,
    VoiceSession,
)
from app.schemas import CallStatusResponse, OutboundCallRequest, OutboundCallResponse

logger = logging.getLogger("calls")
router = APIRouter()

E164_PATTERN = re.compile(r"^\+[1-9]\d{1,14}$")


def _validate_e164(phone_number: str) -> str:
    """Validate and return an E.164-formatted phone number."""
    phone = phone_number.strip()
    if not E164_PATTERN.match(phone):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid phone number format: '{phone}'. Must be E.164 (e.g. +15551234567).",
        )
    return phone


async def _timeout_no_answer(session_id: str, timeout_seconds: int = 60) -> None:
    """Background task: mark call as NO_ANSWER if still RINGING after timeout."""
    await asyncio.sleep(timeout_seconds)

    from app.database import SessionLocal

    db = SessionLocal()
    try:
        session = db.query(VoiceSession).filter(VoiceSession.id == session_id).first()
        if session and session.call_status == CallStatus.RINGING:
            session.call_status = CallStatus.NO_ANSWER
            session.status = SessionStatus.FAILED
            session.ended_at = datetime.utcnow()
            db.commit()
            logger.info(f"Call {session_id} timed out — marked as NO_ANSWER")
    except Exception:
        logger.exception(f"Error in timeout handler for call {session_id}")
    finally:
        db.close()


@router.post("/outbound", response_model=OutboundCallResponse, status_code=201)
async def create_outbound_call(
    request: OutboundCallRequest,
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Initiate an outbound phone call via LiveKit SIP.

    Creates a voice session, a LiveKit room, and dials the phone number.
    """
    # Resolve keys from DB → env fallback
    lk_api_key = get_key(db, "livekit_api_key")
    lk_api_secret = get_key(db, "livekit_api_secret")
    lk_url = get_key(db, "livekit_url")

    # --- Validate inputs ---
    phone = _validate_e164(request.phone_number)

    # --- Authenticate user ---
    user = db.query(User).filter(User.auth_id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # --- Validate agent belongs to user ---
    agent = (
        db.query(Agent)
        .filter(
            Agent.id == request.agent_id,
            Agent.user_id == user.id,
            Agent.is_active == True,
        )
        .first()
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found or does not belong to user")

    # --- Create voice session ---
    session_id = str(uuid.uuid4())
    room_name = f"outbound-{session_id}"

    session = VoiceSession(
        id=session_id,
        room_name=room_name,
        user_id=user.id,
        agent_id=agent.id,
        status=SessionStatus.ACTIVE,
        call_direction=CallDirection.OUTBOUND,
        outbound_phone_number=phone,
        call_status=CallStatus.RINGING,
        callback_url=request.callback_url,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # --- Create LiveKit room & dial via SIP ---
    try:
        from livekit import api as lk_api
        from livekit.protocol.sip import CreateSIPParticipantRequest

        livekit = lk_api.LiveKitAPI(
            url=lk_url,
            api_key=lk_api_key,
            api_secret=lk_api_secret,
        )

        try:
            # Create room and dispatch agent into it
            from livekit.protocol.room import CreateRoomRequest
            from livekit.protocol.agent_dispatch import RoomAgentDispatch

            import json as _json
            await livekit.room.create_room(
                CreateRoomRequest(
                    name=room_name,
                    empty_timeout=120,
                    metadata=_json.dumps({"agentId": agent.id}),
                    agents=[RoomAgentDispatch(agent_name="arkenos-agent")],
                )
            )

            # Get outbound SIP trunk ID (auto-provisioned or fallback)
            from app.services.telephony_provisioning import ensure_outbound_trunk

            try:
                outbound_trunk_id = await ensure_outbound_trunk()
                logger.info(f"Using outbound trunk: {outbound_trunk_id}")
            except Exception as e:
                logger.error(f"Failed to provision outbound trunk: {e}", exc_info=True)
                outbound_trunk_id = get_key(db, "livekit_sip_trunk_id")
                if outbound_trunk_id:
                    logger.info(f"Falling back to env LIVEKIT_SIP_TRUNK_ID: {outbound_trunk_id}")

            if not outbound_trunk_id:
                raise RuntimeError(
                    "No outbound SIP trunk available. "
                    "Ensure Twilio credentials are configured and at least one agent has a phone number."
                )

            # Dial the phone number via SIP
            sip_request = CreateSIPParticipantRequest(
                sip_trunk_id=outbound_trunk_id,
                sip_call_to=phone,
                room_name=room_name,
                participant_identity=f"phone-{phone}",
                participant_name=f"Phone {phone}",
                play_dialtone=True,
            )

            await livekit.sip.create_sip_participant(sip_request)
        finally:
            await livekit.aclose()

    except Exception as e:
        # Mark session as failed if SIP call initiation fails
        session.call_status = CallStatus.FAILED
        session.status = SessionStatus.FAILED
        session.ended_at = datetime.utcnow()
        db.commit()
        logger.error(f"Failed to initiate outbound call: {e}")
        raise HTTPException(status_code=502, detail=f"Failed to initiate call: {str(e)}")

    # --- Schedule no-answer timeout (60 seconds) ---
    background_tasks.add_task(_timeout_no_answer, session_id, 60)

    return OutboundCallResponse(
        call_id=session.id,
        room_name=session.room_name,
        status=session.call_status,
    )


@router.post("/{call_id}/end")
async def end_call(
    call_id: str,
    x_user_id: str = Header(...),
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """End an active outbound call by deleting the LiveKit room."""
    lk_api_key = get_key(db, "livekit_api_key")
    lk_api_secret = get_key(db, "livekit_api_secret")
    lk_url = get_key(db, "livekit_url")

    session = db.query(VoiceSession).filter(VoiceSession.id == call_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Call not found")

    # Verify user owns this call
    user = db.query(User).filter(User.auth_id == x_user_id).first()
    if not user or session.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Delete the LiveKit room to end the call
    try:
        from livekit import api as lk_api
        from livekit.protocol.room import DeleteRoomRequest

        livekit = lk_api.LiveKitAPI(
            url=lk_url,
            api_key=lk_api_key,
            api_secret=lk_api_secret,
        )
        await livekit.room.delete_room(DeleteRoomRequest(room=session.room_name))
        await livekit.aclose()
    except Exception as e:
        logger.warning(f"Failed to delete LiveKit room: {e}")

    # Update session status
    session.call_status = CallStatus.COMPLETED
    session.status = SessionStatus.COMPLETED
    session.ended_at = datetime.utcnow()
    if session.started_at:
        session.duration = int((session.ended_at - session.started_at).total_seconds())
    db.commit()

    return {"success": True, "call_id": call_id}


@router.get("/{call_id}/status", response_model=CallStatusResponse)
async def get_call_status(
    call_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Get the current status of a call."""
    session = db.query(VoiceSession).filter(VoiceSession.id == call_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Call not found")

    # Check LiveKit room state if call is still active
    if session.call_status in (CallStatus.RINGING, CallStatus.ANSWERED) and session.room_name:
        try:
            from livekit import api as lk_api
            from livekit.protocol.room import ListParticipantsRequest, ListRoomsRequest

            lk = lk_api.LiveKitAPI(
                url=get_key(db, "livekit_url"),
                api_key=get_key(db, "livekit_api_key"),
                api_secret=get_key(db, "livekit_api_secret"),
            )
            try:
                # Check if room still exists
                rooms_resp = await lk.room.list_rooms(
                    ListRoomsRequest(names=[session.room_name])
                )
                if not rooms_resp.rooms:
                    # Room gone — call ended
                    session.call_status = CallStatus.COMPLETED
                    session.status = SessionStatus.COMPLETED
                    session.ended_at = session.ended_at or datetime.utcnow()
                    if session.started_at and session.ended_at:
                        session.duration = int((session.ended_at - session.started_at).total_seconds())
                    db.commit()
                else:
                    # Room exists — check participants
                    resp = await lk.room.list_participants(
                        ListParticipantsRequest(room=session.room_name)
                    )
                    has_phone = any(
                        p.identity.startswith("sip_") or p.identity.startswith("phone-") or p.identity.startswith("+")
                        for p in resp.participants
                    )

                    if session.call_status == CallStatus.RINGING and has_phone:
                        session.call_status = CallStatus.ANSWERED
                        db.commit()
                    elif session.call_status == CallStatus.ANSWERED and not has_phone:
                        # Phone participant left — call ended
                        session.call_status = CallStatus.COMPLETED
                        session.status = SessionStatus.COMPLETED
                        session.ended_at = datetime.utcnow()
                        if session.started_at:
                            session.duration = int((session.ended_at - session.started_at).total_seconds())
                        db.commit()
            finally:
                await lk.aclose()
        except Exception:
            pass  # Room may not exist yet, ignore

    return CallStatusResponse(
        call_id=session.id,
        status=session.status,
        call_status=session.call_status,
        call_direction=session.call_direction,
        outbound_phone_number=session.outbound_phone_number,
        room_name=session.room_name,
        started_at=session.started_at,
        ended_at=session.ended_at,
        duration=session.duration,
    )
