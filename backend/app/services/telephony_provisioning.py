"""
Telephony Provisioning Service - Auto-provisions LiveKit SIP infrastructure.
Manages inbound/outbound trunks and dispatch rules for Twilio <-> LiveKit routing.
"""

import logging
import secrets
from dataclasses import dataclass, field

from app.config import get_settings

logger = logging.getLogger("telephony_provisioning")


@dataclass
class ProvisioningState:
    inbound_trunk_id: str | None = None
    inbound_sip_uri: str | None = None
    outbound_trunk_id: str | None = None
    dispatch_rule_id: str | None = None
    twilio_trunk_sid: str | None = None


_state = ProvisioningState()


def _get_lk():
    """Create a LiveKitAPI client from settings."""
    from livekit import api as lk_api

    settings = get_settings()
    return lk_api.LiveKitAPI(
        url=settings.livekit_url,
        api_key=settings.livekit_api_key,
        api_secret=settings.livekit_api_secret,
    )


async def ensure_inbound_trunk(phone: str | None = None) -> str:
    """Ensure an inbound SIP trunk exists. Reuse if found, create if not. Returns trunk ID.
    If creating a new trunk, `phone` is required as LiveKit needs at least one number for security.
    """
    global _state

    if _state.inbound_trunk_id:
        return _state.inbound_trunk_id

    from livekit.api import (
        CreateSIPInboundTrunkRequest,
        ListSIPInboundTrunkRequest,
        SIPInboundTrunkInfo,
    )

    lk = _get_lk()
    try:
        # Check for existing trunk
        resp = await lk.sip.list_sip_inbound_trunk(ListSIPInboundTrunkRequest())
        for trunk in resp.items:
            if trunk.name == "Arkenos Inbound":
                _state.inbound_trunk_id = trunk.sip_trunk_id
                logger.info(f"Reusing existing inbound trunk: {trunk.sip_trunk_id}")
                return trunk.sip_trunk_id

        # Create new trunk — LiveKit requires at least one number for security
        numbers = [phone] if phone else []
        new_trunk = await lk.sip.create_sip_inbound_trunk(
            CreateSIPInboundTrunkRequest(
                trunk=SIPInboundTrunkInfo(name="Arkenos Inbound", numbers=numbers)
            )
        )
        _state.inbound_trunk_id = new_trunk.sip_trunk_id
        logger.info(f"Created inbound trunk: {new_trunk.sip_trunk_id}")
        return new_trunk.sip_trunk_id
    finally:
        await lk.aclose()


async def ensure_dispatch_rule() -> str:
    """Ensure a SIP dispatch rule exists for the arkenos-agent. Returns rule ID."""
    global _state

    if _state.dispatch_rule_id:
        return _state.dispatch_rule_id

    from livekit.api import (
        CreateSIPDispatchRuleRequest,
        ListSIPDispatchRuleRequest,
        SIPDispatchRule,
        SIPDispatchRuleIndividual,
    )
    from livekit.protocol.agent_dispatch import RoomAgentDispatch
    from livekit.protocol.room import RoomConfiguration

    lk = _get_lk()
    try:
        # Check for existing rule
        resp = await lk.sip.list_sip_dispatch_rule(ListSIPDispatchRuleRequest())
        for rule in resp.items:
            if rule.name == "Arkenos Dispatch":
                _state.dispatch_rule_id = rule.sip_dispatch_rule_id
                logger.info(f"Reusing existing dispatch rule: {rule.sip_dispatch_rule_id}")
                return rule.sip_dispatch_rule_id

        # Create new dispatch rule with individual rooms per call
        new_rule = await lk.sip.create_sip_dispatch_rule(
            CreateSIPDispatchRuleRequest(
                name="Arkenos Dispatch",
                rule=SIPDispatchRule(
                    dispatch_rule_individual=SIPDispatchRuleIndividual(
                        room_prefix="sip-",
                    )
                ),
                room_config=RoomConfiguration(
                    agents=[RoomAgentDispatch(agent_name="arkenos-agent")]
                ),
            )
        )
        _state.dispatch_rule_id = new_rule.sip_dispatch_rule_id
        logger.info(f"Created dispatch rule: {new_rule.sip_dispatch_rule_id}")
        return new_rule.sip_dispatch_rule_id
    finally:
        await lk.aclose()


async def add_number_to_inbound_trunk(phone: str) -> None:
    """Add a phone number to the inbound SIP trunk."""
    from livekit.api import ListUpdate

    trunk_id = await ensure_inbound_trunk(phone)
    lk = _get_lk()
    try:
        await lk.sip.update_inbound_trunk_fields(
            trunk_id, numbers=ListUpdate(add=[phone])
        )
        logger.info(f"Added {phone} to inbound trunk {trunk_id}")
    finally:
        await lk.aclose()


async def remove_number_from_inbound_trunk(phone: str) -> None:
    """Remove a phone number from the inbound SIP trunk."""
    from livekit.api import ListUpdate

    if not _state.inbound_trunk_id:
        # Try to find it
        await ensure_inbound_trunk()

    if not _state.inbound_trunk_id:
        logger.warning("No inbound trunk found, nothing to remove from")
        return

    lk = _get_lk()
    try:
        await lk.sip.update_inbound_trunk_fields(
            _state.inbound_trunk_id, numbers=ListUpdate(remove=[phone])
        )
        logger.info(f"Removed {phone} from inbound trunk {_state.inbound_trunk_id}")
    finally:
        await lk.aclose()


async def ensure_outbound_trunk() -> str:
    """Ensure an outbound SIP trunk exists (Twilio Elastic SIP + LiveKit). Returns trunk ID.
    Reuses the same Twilio Elastic SIP Trunk as inbound (trial accounts only allow one).
    """
    global _state

    if _state.outbound_trunk_id:
        return _state.outbound_trunk_id

    from livekit.api import (
        CreateSIPOutboundTrunkRequest,
        ListSIPOutboundTrunkRequest,
        SIPOutboundTrunkInfo,
    )

    settings = get_settings()
    lk = _get_lk()
    try:
        # Check for existing LiveKit outbound trunk
        resp = await lk.sip.list_sip_outbound_trunk(ListSIPOutboundTrunkRequest())
        for trunk in resp.items:
            if trunk.name == "Arkenos Outbound":
                _state.outbound_trunk_id = trunk.sip_trunk_id
                logger.info(f"Reusing existing outbound trunk: {trunk.sip_trunk_id}")
                return trunk.sip_trunk_id

        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        password = secrets.token_urlsafe(32)

        # Find or create credential list for LiveKit → Twilio auth
        cred_list = None
        for cl in client.sip.credential_lists.list():
            if cl.friendly_name == "Arkenos LiveKit":
                cred_list = cl
                # Update password — recreate credential
                for cred in cl.credentials.list():
                    cred.delete()
                cl.credentials.create(username="arkenos-lk", password=password)
                logger.info(f"Reusing existing credential list: {cl.sid}")
                break

        if not cred_list:
            cred_list = client.sip.credential_lists.create(
                friendly_name="Arkenos LiveKit"
            )
            cred_list.credentials.create(username="arkenos-lk", password=password)

        # Reuse existing Twilio Elastic SIP Trunk (trial allows only one)
        twilio_trunk_sid = await ensure_twilio_elastic_trunk()
        trunk_obj = client.trunking.v1.trunks(twilio_trunk_sid).fetch()

        # Enable termination by setting a domain name if not already set
        if not trunk_obj.domain_name:
            domain_name = f"arkenos-{settings.twilio_account_sid[-6:].lower()}.pstn.twilio.com"
            client.trunking.v1.trunks(twilio_trunk_sid).update(
                domain_name=domain_name
            )
            termination_uri = domain_name
            logger.info(f"Set termination domain: {termination_uri}")
        else:
            termination_uri = trunk_obj.domain_name

        # Add credential list for termination auth
        try:
            client.trunking.v1.trunks(twilio_trunk_sid).credentials_lists.create(
                credential_list_sid=cred_list.sid
            )
        except Exception as e:
            logger.warning(f"Could not add credential list to trunk (may already exist): {e}")

        # Collect all phone numbers assigned to agents for the outbound trunk
        from app.database import SessionLocal
        from app import models

        db = SessionLocal()
        try:
            agents_with_phones = db.query(models.Agent).filter(
                models.Agent.phone_number.isnot(None)
            ).all()
            numbers = [a.phone_number for a in agents_with_phones if a.phone_number]
        finally:
            db.close()

        if not numbers:
            raise ValueError("No phone numbers assigned to any agent — assign a number first")

        # Create LiveKit outbound trunk pointing to Twilio
        new_trunk = await lk.sip.create_sip_outbound_trunk(
            CreateSIPOutboundTrunkRequest(
                trunk=SIPOutboundTrunkInfo(
                    name="Arkenos Outbound",
                    address=termination_uri,
                    numbers=numbers,
                    auth_username="arkenos-lk",
                    auth_password=password,
                )
            )
        )
        _state.outbound_trunk_id = new_trunk.sip_trunk_id
        logger.info(f"Created outbound trunk: {new_trunk.sip_trunk_id}")
        return new_trunk.sip_trunk_id
    finally:
        await lk.aclose()


async def ensure_twilio_elastic_trunk() -> str:
    """Ensure a Twilio Elastic SIP Trunk exists with LiveKit origination URI.
    Routes inbound calls directly from Twilio to LiveKit SIP — no webhook needed.
    Returns the Twilio trunk SID.
    """
    global _state

    if _state.twilio_trunk_sid:
        return _state.twilio_trunk_sid

    from twilio.rest import Client

    settings = get_settings()
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    # Check for existing trunk
    trunks = client.trunking.v1.trunks.list()
    for trunk in trunks:
        if trunk.friendly_name == "Arkenos Inbound":
            _state.twilio_trunk_sid = trunk.sid
            logger.info(f"Reusing existing Twilio Elastic SIP Trunk: {trunk.sid}")
            return trunk.sid

    # Create new Elastic SIP Trunk
    sip_uri = get_sip_uri()
    if not sip_uri:
        raise ValueError("Cannot determine LiveKit SIP URI — set LIVEKIT_URL or TWILIO_SIP_DOMAIN")

    trunk = client.trunking.v1.trunks.create(friendly_name="Arkenos Inbound")

    # Add origination URI pointing to LiveKit SIP
    trunk.origination_urls.create(
        friendly_name="LiveKit SIP",
        sip_url=f"sip:{sip_uri}",
        weight=10,
        priority=10,
        enabled=True,
    )

    _state.twilio_trunk_sid = trunk.sid
    logger.info(f"Created Twilio Elastic SIP Trunk: {trunk.sid} → sip:{sip_uri}")
    return trunk.sid


async def associate_number_with_twilio_trunk(phone_sid: str) -> None:
    """Associate a Twilio phone number with the Elastic SIP Trunk.
    This makes inbound calls route directly to LiveKit via SIP origination.
    """
    trunk_sid = await ensure_twilio_elastic_trunk()

    from twilio.rest import Client

    settings = get_settings()
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    # Check if already associated
    existing = client.trunking.v1.trunks(trunk_sid).phone_numbers.list()
    for num in existing:
        if num.sid == phone_sid:
            logger.info(f"Number {phone_sid} already associated with trunk {trunk_sid}")
            return

    client.trunking.v1.trunks(trunk_sid).phone_numbers.create(
        phone_number_sid=phone_sid,
    )
    logger.info(f"Associated number {phone_sid} with Twilio trunk {trunk_sid}")


async def disassociate_number_from_twilio_trunk(phone_sid: str) -> None:
    """Remove a phone number from the Twilio Elastic SIP Trunk."""
    if not _state.twilio_trunk_sid:
        await ensure_twilio_elastic_trunk()

    if not _state.twilio_trunk_sid:
        return

    from twilio.rest import Client

    settings = get_settings()
    client = Client(settings.twilio_account_sid, settings.twilio_auth_token)

    try:
        client.trunking.v1.trunks(_state.twilio_trunk_sid).phone_numbers(phone_sid).delete()
        logger.info(f"Disassociated number {phone_sid} from trunk {_state.twilio_trunk_sid}")
    except Exception as e:
        logger.warning(f"Could not disassociate number from trunk: {e}")


def get_sip_uri() -> str:
    """Return the SIP URI for routing calls to LiveKit.
    Extracts from livekit_url: wss://xyz.livekit.cloud -> xyz.sip.livekit.cloud
    """
    if _state.inbound_sip_uri:
        return _state.inbound_sip_uri

    settings = get_settings()

    # If twilio_sip_domain is explicitly set, use it
    if settings.twilio_sip_domain:
        _state.inbound_sip_uri = settings.twilio_sip_domain
        return _state.inbound_sip_uri

    # Derive from livekit_url: wss://xyz.livekit.cloud -> xyz.sip.livekit.cloud
    lk_url = settings.livekit_url
    if lk_url:
        host = lk_url.replace("wss://", "").replace("ws://", "").rstrip("/")
        parts = host.split(".", 1)
        if len(parts) == 2:
            _state.inbound_sip_uri = f"{parts[0]}.sip.{parts[1]}"
            return _state.inbound_sip_uri

    return ""
