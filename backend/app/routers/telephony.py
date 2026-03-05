"""
Telephony Router - Twilio phone number management and SIP integration.
Handles searching, buying, assigning, and releasing Twilio phone numbers for agents.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app.services.config_resolver import get_key, require_providers
from app import models

logger = logging.getLogger("telephony")
router = APIRouter()


# --- Schemas ---

class NumberSearchResult(BaseModel):
    phone_number: str
    friendly_name: str
    locality: Optional[str] = None
    region: Optional[str] = None


class BuyNumberRequest(BaseModel):
    agent_id: str
    phone_number: str  # The number to purchase (from search results)


class BuyNumberResponse(BaseModel):
    phone_number: str
    twilio_sid: str
    agent_id: str


class ReleaseNumberRequest(BaseModel):
    agent_id: str


class AssignNumberRequest(BaseModel):
    agent_id: str
    phone_number: str  # An already-owned Twilio number (E.164 format, e.g. +1234567890)


# --- Endpoints ---

@router.get("/numbers/search", response_model=list[NumberSearchResult])
async def search_available_numbers(
    area_code: Optional[str] = Query(None, description="Area code to search in"),
    country: str = Query("US", description="Country code"),
    limit: int = Query(10, ge=1, le=20),
    db: Session = Depends(get_db),
    _=Depends(require_providers("twilio")),
):
    """Search for available Twilio phone numbers."""
    twilio_sid = get_key(db, "twilio_account_sid")
    twilio_token = get_key(db, "twilio_auth_token")

    try:
        from twilio.rest import Client
        client = Client(twilio_sid, twilio_token)

        search_params = {"limit": limit}
        if area_code:
            search_params["area_code"] = area_code

        available = client.available_phone_numbers(country).local.list(**search_params)

        return [
            NumberSearchResult(
                phone_number=num.phone_number,
                friendly_name=num.friendly_name,
                locality=num.locality,
                region=num.region,
            )
            for num in available
        ]
    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed. Run: pip install twilio")
    except Exception as e:
        logger.error(f"Error searching numbers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search numbers: {str(e)}")


@router.post("/numbers/buy", response_model=BuyNumberResponse)
async def buy_number(
    request: BuyNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("twilio", "livekit")),
):
    """Purchase a Twilio phone number and assign it to an agent."""
    twilio_sid = get_key(db, "twilio_account_sid")
    twilio_token = get_key(db, "twilio_auth_token")

    # Verify agent exists
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if agent already has a number
    if agent.phone_number and agent.twilio_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    try:
        from twilio.rest import Client
        client = Client(twilio_sid, twilio_token)

        incoming = client.incoming_phone_numbers.create(phone_number=request.phone_number)
    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed. Run: pip install twilio")
    except Exception as e:
        logger.error(f"Error buying number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to buy number: {str(e)}")

    # Number purchased — save to DB immediately so we never lose track of it.
    # If DB save fails, release the Twilio number to avoid orphaned charges.
    try:
        agent.phone_number = incoming.phone_number
        agent.twilio_sid = incoming.sid
        db.commit()
        db.refresh(agent)
    except Exception as e:
        logger.error(f"DB save failed after purchase, releasing number: {e}")
        try:
            client.incoming_phone_numbers(incoming.sid).delete()
        except Exception:
            logger.error(f"CRITICAL: Failed to release orphaned number {incoming.phone_number} (SID: {incoming.sid})")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save number: {str(e)}")

    # Non-critical steps — number is safely saved, so failures here are warnings only
    warnings = []

    # Provision LiveKit SIP infrastructure
    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        associate_number_with_twilio_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
    )

    try:
        await ensure_inbound_trunk(incoming.phone_number)
        await ensure_dispatch_rule()
        await add_number_to_inbound_trunk(incoming.phone_number)
    except Exception as e:
        msg = f"LiveKit SIP provisioning failed: {e}"
        logger.warning(msg)
        warnings.append(msg)

    # Associate number with Twilio Elastic SIP Trunk → routes directly to LiveKit (no webhook needed)
    try:
        await associate_number_with_twilio_trunk(incoming.sid)
    except Exception as e:
        msg = f"Twilio SIP trunk association failed: {e}"
        logger.warning(msg)
        warnings.append(msg)

    logger.info(f"Purchased number {incoming.phone_number} for agent {agent.name}")

    return BuyNumberResponse(
        phone_number=incoming.phone_number,
        twilio_sid=incoming.sid,
        agent_id=agent.id,
    )


@router.post("/numbers/release")
async def release_number(
    request: ReleaseNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("twilio", "livekit")),
):
    """Release a Twilio phone number from an agent."""
    twilio_sid = get_key(db, "twilio_account_sid")
    twilio_token = get_key(db, "twilio_auth_token")

    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.phone_number:
        raise HTTPException(status_code=400, detail="Agent has no assigned phone number")

    try:
        # Remove number from LiveKit inbound trunk + Twilio Elastic SIP Trunk
        if agent.phone_number:
            from app.services.telephony_provisioning import (
                disassociate_number_from_twilio_trunk,
                remove_number_from_inbound_trunk,
            )

            try:
                await remove_number_from_inbound_trunk(agent.phone_number)
            except Exception as e:
                logger.warning(f"Could not remove number from LiveKit trunk: {e}")

            if agent.twilio_sid:
                try:
                    await disassociate_number_from_twilio_trunk(agent.twilio_sid)
                except Exception as e:
                    logger.warning(f"Could not disassociate from Twilio trunk: {e}")

        old_number = agent.phone_number
        agent.phone_number = None
        agent.twilio_sid = None
        db.commit()

        logger.info(f"Released number {old_number} from agent {agent.name}")
        return {"status": "released", "phone_number": old_number}

    except ImportError:
        raise HTTPException(status_code=500, detail="Twilio SDK not installed")
    except Exception as e:
        logger.error(f"Error releasing number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to release number: {str(e)}")


@router.post("/numbers/assign")
async def assign_existing_number(
    request: AssignNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("twilio", "livekit")),
):
    """Assign an already-owned Twilio number to an agent (no purchase)."""
    tw_account_sid = get_key(db, "twilio_account_sid")
    tw_auth_token = get_key(db, "twilio_auth_token")

    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.phone_number and agent.twilio_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    # Normalize the number
    phone = request.phone_number.strip()
    if not phone.startswith("+"):
        phone = f"+{phone}"

    # Validate ownership by looking it up in Twilio account
    twilio_sid = None
    if tw_account_sid and tw_auth_token:
        try:
            from twilio.rest import Client
            client = Client(tw_account_sid, tw_auth_token)
            numbers = client.incoming_phone_numbers.list(phone_number=phone)
            if numbers:
                twilio_sid = numbers[0].sid
            else:
                logger.warning(f"Number {phone} not found in Twilio account — assigning anyway")
        except Exception as e:
            logger.warning(f"Could not verify number in Twilio: {e} — assigning anyway")

    agent.phone_number = phone
    agent.twilio_sid = twilio_sid  # May be None if Twilio lookup failed
    db.commit()
    db.refresh(agent)

    # Provision LiveKit SIP infrastructure
    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        associate_number_with_twilio_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
    )

    try:
        await ensure_inbound_trunk(phone)
        await ensure_dispatch_rule()
        await add_number_to_inbound_trunk(phone)
    except Exception as e:
        logger.warning(f"LiveKit SIP provisioning failed (non-fatal): {e}")

    # Associate with Twilio Elastic SIP Trunk → routes directly to LiveKit
    if twilio_sid:
        try:
            await associate_number_with_twilio_trunk(twilio_sid)
        except Exception as e:
            logger.warning(f"Twilio SIP trunk association failed: {e}")

    logger.info(f"Assigned existing number {phone} to agent {agent.name}")
    return {
        "status": "assigned",
        "phone_number": phone,
        "twilio_sid": twilio_sid,
        "agent_id": agent.id,
    }


@router.post("/numbers/provision")
async def provision_pipeline(
    request: ReleaseNumberRequest,  # reuse schema — just needs agent_id
    db: Session = Depends(get_db),
    _=Depends(require_providers("twilio", "livekit")),
):
    """Test and set up the full SIP pipeline for an agent's phone number.
    Checks each step, provisions anything missing, and returns per-step results."""
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if not agent.phone_number:
        raise HTTPException(status_code=400, detail="Agent has no phone number to provision")

    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        associate_number_with_twilio_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
        ensure_outbound_trunk,
    )

    steps = []

    # Step 1: LiveKit inbound trunk
    try:
        trunk_id = await ensure_inbound_trunk(agent.phone_number)
        steps.append({"step": "LiveKit Inbound Trunk", "status": "ok", "detail": f"Trunk ID: {trunk_id}"})
    except Exception as e:
        steps.append({"step": "LiveKit Inbound Trunk", "status": "error", "detail": str(e)})

    # Step 2: LiveKit dispatch rule
    try:
        rule_id = await ensure_dispatch_rule()
        steps.append({"step": "LiveKit Dispatch Rule", "status": "ok", "detail": f"Rule ID: {rule_id}"})
    except Exception as e:
        steps.append({"step": "LiveKit Dispatch Rule", "status": "error", "detail": str(e)})

    # Step 3: Add number to inbound trunk
    try:
        await add_number_to_inbound_trunk(agent.phone_number)
        steps.append({"step": "Number on Inbound Trunk", "status": "ok", "detail": agent.phone_number})
    except Exception as e:
        steps.append({"step": "Number on Inbound Trunk", "status": "error", "detail": str(e)})

    # Step 4: Twilio Elastic SIP Trunk association
    # If twilio_sid is missing (manual assignment), try to resolve it from Twilio
    phone_sid = agent.twilio_sid
    if not phone_sid:
        try:
            tw_sid = get_key(db, "twilio_account_sid")
            tw_token = get_key(db, "twilio_auth_token")
            if tw_sid and tw_token:
                from twilio.rest import Client
                client = Client(tw_sid, tw_token)
                numbers = client.incoming_phone_numbers.list(phone_number=agent.phone_number)
                if numbers:
                    phone_sid = numbers[0].sid
                    agent.twilio_sid = phone_sid
                    db.commit()
                    logger.info(f"Resolved Twilio SID {phone_sid} for manually assigned number {agent.phone_number}")
        except Exception as e:
            logger.warning(f"Could not resolve Twilio SID for {agent.phone_number}: {e}")

    if phone_sid:
        try:
            await associate_number_with_twilio_trunk(phone_sid)
            steps.append({"step": "Twilio SIP Trunk", "status": "ok", "detail": f"Number SID: {phone_sid}"})
        except Exception as e:
            steps.append({"step": "Twilio SIP Trunk", "status": "error", "detail": str(e)})
    else:
        steps.append({"step": "Twilio SIP Trunk", "status": "warning", "detail": "Number not found in Twilio account — verify it exists and matches your Twilio credentials"})

    # Step 5: LiveKit outbound trunk (for making outbound calls)
    try:
        outbound_id = await ensure_outbound_trunk()
        steps.append({"step": "LiveKit Outbound Trunk", "status": "ok", "detail": f"Trunk ID: {outbound_id}"})
    except Exception as e:
        steps.append({"step": "LiveKit Outbound Trunk", "status": "error", "detail": str(e)})

    all_ok = all(s["status"] == "ok" for s in steps)
    has_errors = any(s["status"] == "error" for s in steps)

    return {
        "status": "ready" if all_ok else ("partial" if not has_errors else "error"),
        "phone_number": agent.phone_number,
        "agent_id": agent.id,
        "steps": steps,
    }


# --- Utility ---

def normalize_phone(number: str) -> str:
    """Strip all non-digit characters and normalize to E.164.
    Handles US numbers stored without country code (e.g. '(254) 566-4820' → '+12545664820').
    """
    if not number:
        return ""
    digits = "".join(c for c in number if c.isdigit())
    if not digits:
        return ""
    if len(digits) == 10:
        digits = "1" + digits
    return f"+{digits}"


# --- Agent Lookup (used by Agent worker for SIP dispatch) ---

@router.get("/lookup")
async def lookup_agent_by_phone(
    phone_number: str = Query(..., description="The phone number to look up"),
    db: Session = Depends(get_db),
):
    """Look up an agent by its assigned phone number. Used by the agent worker for SIP dispatch."""
    normalized_input = normalize_phone(phone_number)
    logger.info(f"Looking up agent for phone: {phone_number} (normalized: {normalized_input})")

    # Get all agents with a phone number and compare normalized versions
    agents = (
        db.query(models.Agent)
        .filter(models.Agent.phone_number.isnot(None), models.Agent.is_active == True)
        .all()
    )

    for a in agents:
        if normalize_phone(a.phone_number) == normalized_input:
            logger.info(f"Found agent: {a.name} (id={a.id}) for number {phone_number}")
            return {"agent_id": a.id, "name": a.name, "config": a.config}

    raise HTTPException(status_code=404, detail="No agent found for this phone number")
