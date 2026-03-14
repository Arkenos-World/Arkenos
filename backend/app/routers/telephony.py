"""
Telephony Router - Phone number management and SIP integration.
Handles searching, buying, assigning, and releasing phone numbers for agents.
Supports multiple telephony providers (Twilio, Telnyx, etc.) via provider abstraction.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from app.database import get_db
from app.services.config_resolver import get_key, require_providers
from app.services.telephony_providers import get_provider
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
    provider: str = "twilio"


class BuyNumberResponse(BaseModel):
    phone_number: str
    provider_number_sid: str
    agent_id: str


class ReleaseNumberRequest(BaseModel):
    agent_id: str


class AssignNumberRequest(BaseModel):
    agent_id: str
    phone_number: str  # An already-owned number (E.164 format, e.g. +1234567890)
    provider: str = "twilio"


class ReassignNumberRequest(BaseModel):
    phone_number: str  # The number to reassign (E.164)
    target_agent_id: str  # Agent to assign the number TO


class ReassignNumberResponse(BaseModel):
    phone_number: str
    provider_number_sid: Optional[str] = None
    target_agent_id: str
    source_agent_id: Optional[str] = None
    source_agent_name: Optional[str] = None
    pipeline_result: Optional[dict] = None


# --- Helper ---

def _require_provider_configured(provider_name: str, db: Session) -> None:
    """Check that the requested telephony provider has valid credentials configured."""
    try:
        provider_impl = get_provider(provider_name, db)
        # The provider factory itself validates known names; credentials are checked lazily.
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown telephony provider: {provider_name}",
        )


# --- Endpoints ---

@router.get("/numbers/search", response_model=list[NumberSearchResult])
async def search_available_numbers(
    area_code: Optional[str] = Query(None, description="Area code to search in"),
    country: str = Query("US", description="Country code"),
    limit: int = Query(10, ge=1, le=20),
    provider: str = Query("twilio", description="Telephony provider to search"),
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Search for available phone numbers from the specified provider."""
    _require_provider_configured(provider, db)

    try:
        provider_impl = get_provider(provider, db)
        results = await provider_impl.search_numbers(country, area_code or "", limit)

        return [
            NumberSearchResult(
                phone_number=num["phone_number"],
                friendly_name=num["friendly_name"],
                locality=num.get("locality"),
                region=num.get("region"),
            )
            for num in results
        ]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching numbers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search numbers: {str(e)}")


@router.post("/numbers/buy", response_model=BuyNumberResponse)
async def buy_number(
    request: BuyNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Purchase a phone number from the specified provider and assign it to an agent."""
    _require_provider_configured(request.provider, db)

    # Verify agent exists
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Check if agent already has a number
    if agent.phone_number and agent.provider_number_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    try:
        provider_impl = get_provider(request.provider, db)
        result = await provider_impl.buy_number(request.phone_number)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error buying number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to buy number: {str(e)}")

    # Number purchased — save to DB immediately so we never lose track of it.
    try:
        agent.phone_number = result["phone_number"]
        agent.provider_number_sid = result["sid"]
        agent.telephony_provider = request.provider
        db.commit()
        db.refresh(agent)
    except Exception as e:
        logger.error(f"DB save failed after purchase, attempting cleanup: {e}")
        # Try to release via provider (best-effort)
        try:
            # Provider-specific cleanup would go here if the interface supported release
            pass
        except Exception:
            logger.error(f"CRITICAL: Failed to release orphaned number {result['phone_number']} (SID: {result['sid']})")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save number: {str(e)}")

    # Non-critical steps — number is safely saved, so failures here are warnings only
    warnings = []

    # Provision LiveKit SIP infrastructure
    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
        get_sip_uri,
    )

    try:
        await ensure_inbound_trunk(result["phone_number"])
        await ensure_dispatch_rule()
        await add_number_to_inbound_trunk(result["phone_number"])
    except Exception as e:
        msg = f"LiveKit SIP provisioning failed: {e}"
        logger.warning(msg)
        warnings.append(msg)

    # Associate number with provider SIP trunk — routes directly to LiveKit
    try:
        sip_uri = get_sip_uri()
        await provider_impl.configure_sip_inbound(sip_uri)
        await provider_impl.associate_number_with_sip(result["sid"])
    except Exception as e:
        msg = f"Provider SIP trunk association failed: {e}"
        logger.warning(msg)
        warnings.append(msg)

    logger.info(f"Purchased number {result['phone_number']} for agent {agent.name} via {request.provider}")

    return BuyNumberResponse(
        phone_number=result["phone_number"],
        provider_number_sid=result["sid"],
        agent_id=agent.id,
    )


@router.post("/numbers/release")
async def release_number(
    request: ReleaseNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Release a phone number from an agent."""
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.phone_number:
        raise HTTPException(status_code=400, detail="Agent has no assigned phone number")

    try:
        # Remove number from LiveKit inbound trunk
        if agent.phone_number:
            from app.services.telephony_provisioning import (
                remove_number_from_inbound_trunk,
            )

            try:
                await remove_number_from_inbound_trunk(agent.phone_number)
            except Exception as e:
                logger.warning(f"Could not remove number from LiveKit trunk: {e}")

            # Disassociate from provider SIP trunk
            if agent.provider_number_sid:
                provider_name = agent.telephony_provider or "twilio"
                try:
                    provider_impl = get_provider(provider_name, db)
                    await provider_impl.disassociate_number_from_sip(agent.provider_number_sid)
                except Exception as e:
                    logger.warning(f"Could not disassociate from provider trunk: {e}")

        old_number = agent.phone_number
        agent.phone_number = None
        agent.provider_number_sid = None
        agent.telephony_provider = None
        db.commit()

        logger.info(f"Released number {old_number} from agent {agent.name}")
        return {"status": "released", "phone_number": old_number}

    except Exception as e:
        logger.error(f"Error releasing number: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to release number: {str(e)}")


@router.post("/numbers/assign")
async def assign_existing_number(
    request: AssignNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Assign an already-owned phone number to an agent (no purchase)."""
    _require_provider_configured(request.provider, db)

    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.phone_number and agent.provider_number_sid:
        raise HTTPException(
            status_code=400,
            detail=f"Agent already has number {agent.phone_number}. Release it first.",
        )

    # Normalize the number
    phone = request.phone_number.strip()
    if not phone.startswith("+"):
        phone = f"+{phone}"

    # Validate ownership by looking it up in the provider account
    provider_number_sid = None
    try:
        provider_impl = get_provider(request.provider, db)
        provider_number_sid = await provider_impl.validate_ownership(phone)
        if not provider_number_sid:
            logger.warning(f"Number {phone} not found in {request.provider} account — assigning anyway")
    except Exception as e:
        logger.warning(f"Could not verify number in {request.provider}: {e} — assigning anyway")

    agent.phone_number = phone
    agent.provider_number_sid = provider_number_sid  # May be None if lookup failed
    agent.telephony_provider = request.provider
    db.commit()
    db.refresh(agent)

    # Provision LiveKit SIP infrastructure
    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
        get_sip_uri,
    )

    try:
        await ensure_inbound_trunk(phone)
        await ensure_dispatch_rule()
        await add_number_to_inbound_trunk(phone)
    except Exception as e:
        logger.warning(f"LiveKit SIP provisioning failed (non-fatal): {e}")

    # Associate with provider SIP trunk — routes directly to LiveKit
    if provider_number_sid:
        try:
            provider_impl = get_provider(request.provider, db)
            sip_uri = get_sip_uri()

            # Warn if SIP URI was auto-derived rather than explicitly set
            from app.services.config_resolver import get_key as _get_key
            explicit = _get_key(db, "livekit_sip_uri")
            if not explicit:
                logger.warning(
                    f"SIP URI was auto-derived ({sip_uri}) — may be incorrect. "
                    f"Set livekit_sip_uri in API Keys."
                )

            await provider_impl.configure_sip_inbound(sip_uri)
            await provider_impl.associate_number_with_sip(provider_number_sid)
        except Exception as e:
            logger.warning(f"Provider SIP trunk association failed: {e}")

    logger.info(f"Assigned existing number {phone} to agent {agent.name} via {request.provider}")
    return {
        "status": "assigned",
        "phone_number": phone,
        "provider_number_sid": provider_number_sid,
        "agent_id": agent.id,
    }


@router.post("/numbers/provision")
async def provision_pipeline(
    request: ReleaseNumberRequest,  # reuse schema — just needs agent_id
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Test and set up the full SIP pipeline for an agent's phone number.
    Checks each step, provisions anything missing, and returns per-step results."""
    agent = db.query(models.Agent).filter(models.Agent.id == request.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if not agent.phone_number:
        raise HTTPException(status_code=400, detail="Agent has no phone number to provision")

    provider_name = agent.telephony_provider or "twilio"

    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
        ensure_outbound_trunk,
        get_sip_uri,
    )

    steps = []

    # Step 0: SIP URI check — must be explicitly set (auto-derive is unreliable)
    from app.services.config_resolver import get_key as _get_key
    explicit_sip_uri = _get_key(db, "livekit_sip_uri")
    if explicit_sip_uri:
        sip_uri_value = get_sip_uri()
        steps.append({"step": "SIP URI", "status": "ok", "detail": f"{sip_uri_value}"})
    else:
        steps.append({
            "step": "SIP URI",
            "status": "error",
            "detail": "LiveKit SIP URI not configured. Go to LiveKit Dashboard → Settings, "
                      "copy the SIP URI, then save it in API Keys → LiveKit → SIP URI field.",
        })

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

    # Step 4: Provider SIP Trunk association
    # Always re-resolve the SID via the provider to ensure we have the correct resource ID.
    # Telnyx order IDs differ from phone number resource IDs, and switching providers
    # means the stored SID is invalid for the new provider.
    try:
        provider_impl = get_provider(provider_name, db)
        phone_sid = await provider_impl.validate_ownership(agent.phone_number)
        if phone_sid:
            agent.provider_number_sid = phone_sid
            agent.telephony_provider = provider_name
            db.commit()
            logger.info(f"Resolved {provider_name} SID {phone_sid} for {agent.phone_number}")
        else:
            phone_sid = agent.provider_number_sid  # Fallback to stored
    except Exception as e:
        logger.warning(f"Could not resolve provider SID for {agent.phone_number}: {e}")
        phone_sid = agent.provider_number_sid  # Fallback to stored

    if phone_sid:
        try:
            provider_impl = get_provider(provider_name, db)
            sip_uri = get_sip_uri()
            sip_result = await provider_impl.configure_sip_inbound(sip_uri)
            await provider_impl.associate_number_with_sip(phone_sid)
            trunk_id = sip_result.get("trunk_id", "unknown") if isinstance(sip_result, dict) else sip_result
            detail = f"Number SID: {phone_sid}"
            if isinstance(sip_result, dict) and sip_result.get("stale_uri_fixed"):
                detail += f" | Auto-fixed stale SIP URI: replaced {sip_result['stale_uri']} with sip:{sip_uri}"
            steps.append({"step": "Provider SIP Trunk", "status": "ok", "detail": detail})
        except Exception as e:
            steps.append({"step": "Provider SIP Trunk", "status": "error", "detail": str(e)})
    else:
        steps.append({"step": "Provider SIP Trunk", "status": "warning", "detail": "Number not found in provider account — verify it exists and matches your credentials"})

    # Step 5: LiveKit outbound trunk (for making outbound calls)
    try:
        outbound_id = await ensure_outbound_trunk(provider_name)
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


@router.get("/numbers/check")
async def check_number_assignment(
    phone_number: str = Query(..., description="Phone number to check (E.164)"),
    db: Session = Depends(get_db),
):
    """Check if a phone number is currently assigned to any agent globally."""
    normalized_input = normalize_phone(phone_number)
    if not normalized_input:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    agents = (
        db.query(models.Agent)
        .filter(models.Agent.phone_number.isnot(None))
        .all()
    )

    for a in agents:
        if normalize_phone(a.phone_number) == normalized_input:
            return {
                "assigned": True,
                "agent_id": a.id,
                "agent_name": a.name,
                "user_id": a.user_id,
            }

    return {"assigned": False}


@router.post("/numbers/reassign", response_model=ReassignNumberResponse)
async def reassign_number(
    request: ReassignNumberRequest,
    db: Session = Depends(get_db),
    _=Depends(require_providers("livekit")),
):
    """Reassign a phone number to a different agent, releasing it from the current owner if any."""
    normalized_phone = normalize_phone(request.phone_number)
    if not normalized_phone:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    # Verify target agent exists
    target_agent = db.query(models.Agent).filter(models.Agent.id == request.target_agent_id).first()
    if not target_agent:
        raise HTTPException(status_code=404, detail="Target agent not found")

    # Check target agent doesn't already have a different number
    if target_agent.phone_number and target_agent.provider_number_sid:
        target_normalized = normalize_phone(target_agent.phone_number)
        if target_normalized != normalized_phone:
            raise HTTPException(
                status_code=400,
                detail=f"Agent already has number {target_agent.phone_number}. Release it first.",
            )

    # Global check: find if ANY agent currently has this number
    source_agent = None
    all_agents_with_phone = (
        db.query(models.Agent)
        .filter(models.Agent.phone_number.isnot(None))
        .all()
    )
    for a in all_agents_with_phone:
        if normalize_phone(a.phone_number) == normalized_phone:
            source_agent = a
            break

    # Prevent self-reassign
    if source_agent and source_agent.id == target_agent.id:
        raise HTTPException(
            status_code=400,
            detail="Number is already assigned to this agent",
        )

    source_agent_id = None
    source_agent_name = None
    provider_number_sid = None
    source_provider = None

    if source_agent:
        # Release from source agent
        source_agent_id = source_agent.id
        source_agent_name = source_agent.name
        provider_number_sid = source_agent.provider_number_sid  # carry over to avoid redundant lookup
        source_provider = source_agent.telephony_provider or "twilio"

        from app.services.telephony_provisioning import (
            remove_number_from_inbound_trunk,
        )

        try:
            await remove_number_from_inbound_trunk(source_agent.phone_number)
        except Exception as e:
            logger.warning(f"Could not remove number from LiveKit trunk during reassign: {e}")

        if source_agent.provider_number_sid:
            try:
                provider_impl = get_provider(source_provider, db)
                await provider_impl.disassociate_number_from_sip(source_agent.provider_number_sid)
            except Exception as e:
                logger.warning(f"Could not disassociate from provider trunk during reassign: {e}")

        source_agent.phone_number = None
        source_agent.provider_number_sid = None
        source_agent.telephony_provider = None
        db.commit()
        logger.info(f"Released number {normalized_phone} from agent {source_agent_name} for reassignment")
    else:
        # Number not assigned to anyone — do provider lookup for provider_number_sid
        # Try each configured provider until one claims ownership
        for try_provider in ("twilio", "telnyx"):
            try:
                provider_impl = get_provider(try_provider, db)
                provider_number_sid = await provider_impl.validate_ownership(normalized_phone)
                if provider_number_sid:
                    source_provider = try_provider  # use this provider for subsequent steps
                    logger.info(f"Number {normalized_phone} found in {try_provider} account during reassign")
                    break
            except Exception as e:
                logger.warning(f"Could not verify number in {try_provider} during reassign: {e}")
        else:
            logger.warning(f"Number {normalized_phone} not found in any provider account during reassign")

    # Determine provider for target: carry over source provider or default to twilio
    target_provider_name = source_provider or "twilio"

    # Assign to target agent
    target_agent.phone_number = normalized_phone
    target_agent.provider_number_sid = provider_number_sid
    target_agent.telephony_provider = target_provider_name
    db.commit()
    db.refresh(target_agent)

    # Auto-provision pipeline
    from app.services.telephony_provisioning import (
        add_number_to_inbound_trunk,
        ensure_dispatch_rule,
        ensure_inbound_trunk,
        ensure_outbound_trunk,
        get_sip_uri,
    )

    steps = []

    # Step 1: LiveKit inbound trunk
    try:
        trunk_id = await ensure_inbound_trunk(normalized_phone)
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
        await add_number_to_inbound_trunk(normalized_phone)
        steps.append({"step": "Number on Inbound Trunk", "status": "ok", "detail": normalized_phone})
    except Exception as e:
        steps.append({"step": "Number on Inbound Trunk", "status": "error", "detail": str(e)})

    # Step 4: Provider SIP Trunk association
    if provider_number_sid:
        try:
            provider_impl = get_provider(target_provider_name, db)
            sip_uri = get_sip_uri()
            await provider_impl.configure_sip_inbound(sip_uri)
            await provider_impl.associate_number_with_sip(provider_number_sid)
            steps.append({"step": "Provider SIP Trunk", "status": "ok", "detail": f"Number SID: {provider_number_sid}"})
        except Exception as e:
            steps.append({"step": "Provider SIP Trunk", "status": "error", "detail": str(e)})
    else:
        steps.append({"step": "Provider SIP Trunk", "status": "warning", "detail": "No provider SID available — skipped"})

    # Step 5: LiveKit outbound trunk
    try:
        outbound_id = await ensure_outbound_trunk(target_provider_name)
        steps.append({"step": "LiveKit Outbound Trunk", "status": "ok", "detail": f"Trunk ID: {outbound_id}"})
    except Exception as e:
        steps.append({"step": "LiveKit Outbound Trunk", "status": "error", "detail": str(e)})

    all_ok = all(s["status"] == "ok" for s in steps)
    has_errors = any(s["status"] == "error" for s in steps)

    pipeline_result = {
        "status": "ready" if all_ok else ("partial" if not has_errors else "error"),
        "steps": steps,
    }

    logger.info(f"Reassigned number {normalized_phone} to agent {target_agent.name} (from {source_agent_name or 'unassigned'})")

    return ReassignNumberResponse(
        phone_number=normalized_phone,
        provider_number_sid=provider_number_sid,
        target_agent_id=target_agent.id,
        source_agent_id=source_agent_id,
        source_agent_name=source_agent_name,
        pipeline_result=pipeline_result,
    )


# --- Debug ---

@router.get("/debug/sip-state")
async def debug_sip_state(db: Session = Depends(get_db)):
    """Debug endpoint: dump all LiveKit SIP trunks, dispatch rules, and provider config."""
    from app.services.telephony_provisioning import _get_lk, _state
    from livekit.api import (
        ListSIPInboundTrunkRequest,
        ListSIPOutboundTrunkRequest,
        ListSIPDispatchRuleRequest,
    )

    result = {"cached_state": {
        "inbound_trunk_id": _state.inbound_trunk_id,
        "outbound_trunk_ids": _state.outbound_trunk_ids,
        "dispatch_rule_id": _state.dispatch_rule_id,
        "inbound_sip_uri": _state.inbound_sip_uri,
    }}

    try:
        lk = _get_lk()
        try:
            # Inbound trunks
            inbound = await lk.sip.list_sip_inbound_trunk(ListSIPInboundTrunkRequest())
            result["inbound_trunks"] = [{
                "id": t.sip_trunk_id,
                "name": t.name,
                "numbers": list(t.numbers) if t.numbers else [],
                "allowed_addresses": list(t.allowed_addresses) if t.allowed_addresses else [],
            } for t in inbound.items]

            # Outbound trunks
            outbound = await lk.sip.list_sip_outbound_trunk(ListSIPOutboundTrunkRequest())
            result["outbound_trunks"] = [{
                "id": t.sip_trunk_id,
                "name": t.name,
                "address": t.address,
                "numbers": list(t.numbers) if t.numbers else [],
                "auth_username": t.auth_username,
            } for t in outbound.items]

            # Dispatch rules
            rules = await lk.sip.list_sip_dispatch_rule(ListSIPDispatchRuleRequest())
            result["dispatch_rules"] = [{
                "id": r.sip_dispatch_rule_id,
                "name": r.name,
                "trunk_ids": list(r.trunk_ids) if r.trunk_ids else [],
            } for r in rules.items]
        finally:
            await lk.aclose()
    except Exception as e:
        result["error"] = str(e)

    # Also show agents with phone numbers
    agents = db.query(models.Agent).filter(models.Agent.phone_number.isnot(None)).all()
    result["agents_with_phones"] = [{
        "id": a.id,
        "name": a.name,
        "phone_number": a.phone_number,
        "provider_number_sid": a.provider_number_sid,
        "telephony_provider": a.telephony_provider,
    } for a in agents]

    # SIP URI
    from app.services.telephony_provisioning import get_sip_uri
    result["sip_uri"] = get_sip_uri()

    return result


# --- Utility ---

def normalize_phone(number: str) -> str:
    """Strip all non-digit characters and normalize to E.164.
    Handles US numbers stored without country code (e.g. '(254) 566-4820' -> '+12545664820').
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


