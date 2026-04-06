"""
Telephony Provisioning Service - Auto-provisions LiveKit SIP infrastructure.
Manages inbound/outbound trunks and dispatch rules for provider <-> LiveKit routing.
"""

import logging
from dataclasses import dataclass, field

from app.database import SessionLocal
from app.services.config_resolver import get_key

logger = logging.getLogger("telephony_provisioning")


@dataclass
class ProvisioningState:
    inbound_trunk_id: str | None = None
    inbound_sip_uri: str | None = None
    outbound_trunk_ids: dict[str, str] = field(default_factory=dict)
    dispatch_rule_id: str | None = None


_state = ProvisioningState()


def clear_sip_uri_cache() -> None:
    """Clear all cached provisioning state so it's re-discovered on next use.

    Called when LiveKit keys change — trunk/rule IDs may point to a different
    project, so everything must be re-resolved.
    """
    _state.inbound_sip_uri = None
    _state.inbound_trunk_id = None
    _state.dispatch_rule_id = None
    _state.outbound_trunk_ids = {}
    logger.info("[clear_sip_uri_cache] All provisioning cache cleared")


def clear_provisioning_cache() -> None:
    """Clear all cached trunk/rule IDs. Call before re-provisioning to self-heal
    after LiveKit project changes without needing a backend restart."""
    _state.inbound_trunk_id = None
    _state.inbound_sip_uri = None
    _state.outbound_trunk_ids.clear()
    _state.dispatch_rule_id = None
    logger.info("[clear_provisioning_cache] All provisioning caches cleared")


def _get_lk():
    """Create a LiveKitAPI client from DB/env keys."""
    from livekit import api as lk_api

    db = SessionLocal()
    try:
        return lk_api.LiveKitAPI(
            url=get_key(db, "livekit_url"),
            api_key=get_key(db, "livekit_api_key"),
            api_secret=get_key(db, "livekit_api_secret"),
        )
    finally:
        db.close()


async def ensure_inbound_trunk(phone: str | None = None) -> str:
    """Ensure an inbound SIP trunk exists. Reuse if found, create if not. Returns trunk ID.
    If creating a new trunk, `phone` is required as LiveKit needs at least one number for security.
    Validates cached trunk ID against LiveKit to self-heal after project changes.
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
        from livekit.api import ListUpdate

        # Check for existing trunk
        resp = await lk.sip.list_sip_inbound_trunk(ListSIPInboundTrunkRequest())
        logger.info(f"[ensure_inbound_trunk] Found {len(resp.items)} existing inbound trunks")
        for trunk in resp.items:
            logger.info(
                f"[ensure_inbound_trunk]   trunk id={trunk.sip_trunk_id}, name={trunk.name}, "
                f"numbers={list(trunk.numbers) if trunk.numbers else []}, "
                f"allowed_addresses={list(trunk.allowed_addresses) if trunk.allowed_addresses else []}"
            )
            if trunk.name == "Arkenos Inbound":
                _state.inbound_trunk_id = trunk.sip_trunk_id
                # Ensure allowed_addresses includes 0.0.0.0/0 so all providers can reach it
                # (security is handled by the numbers allowlist)
                if not trunk.allowed_addresses or "0.0.0.0/0" not in trunk.allowed_addresses:
                    await lk.sip.update_inbound_trunk_fields(
                        trunk.sip_trunk_id,
                        allowed_addresses=ListUpdate(set=["0.0.0.0/0"]),
                    )
                    logger.info(f"[ensure_inbound_trunk] Updated inbound trunk allowed_addresses to 0.0.0.0/0")
                logger.info(f"[ensure_inbound_trunk] Reusing existing inbound trunk: {trunk.sip_trunk_id}")
                return trunk.sip_trunk_id

        # Create new trunk — LiveKit requires at least one number for security
        numbers = [phone] if phone else []
        logger.info(f"[ensure_inbound_trunk] Creating new inbound trunk with numbers={numbers}")
        new_trunk = await lk.sip.create_sip_inbound_trunk(
            CreateSIPInboundTrunkRequest(
                trunk=SIPInboundTrunkInfo(
                    name="Arkenos Inbound",
                    numbers=numbers,
                    allowed_addresses=["0.0.0.0/0"],
                )
            )
        )
        _state.inbound_trunk_id = new_trunk.sip_trunk_id
        logger.info(f"[ensure_inbound_trunk] Created inbound trunk: {new_trunk.sip_trunk_id}")
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
        logger.info(f"[ensure_dispatch_rule] Found {len(resp.items)} existing dispatch rules")
        for rule in resp.items:
            logger.info(
                f"[ensure_dispatch_rule]   rule id={rule.sip_dispatch_rule_id}, name={rule.name}, "
                f"trunk_ids={list(rule.trunk_ids) if rule.trunk_ids else []}"
            )
            if rule.name == "Arkenos Dispatch":
                _state.dispatch_rule_id = rule.sip_dispatch_rule_id
                logger.info(f"[ensure_dispatch_rule] Reusing existing dispatch rule: {rule.sip_dispatch_rule_id}")
                return rule.sip_dispatch_rule_id

        # Create new dispatch rule with individual rooms per call
        logger.info("[ensure_dispatch_rule] No matching dispatch rule found, creating new one")
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


async def ensure_custom_agent_dispatch_rule(agent_id: str, phone_number: str) -> str:
    """Create or reuse a SIP dispatch rule for a custom agent.

    Custom agents register with LiveKit as 'arkenos-custom-{agent_id}', so they
    need their own dispatch rule that routes calls to that specific worker.
    The rule is pin-locked to the agent's phone number(s).

    Returns the dispatch rule ID.
    """
    from livekit.api import (
        CreateSIPDispatchRuleRequest,
        ListSIPDispatchRuleRequest,
        SIPDispatchRule,
        SIPDispatchRuleIndividual,
    )
    from livekit.protocol.agent_dispatch import RoomAgentDispatch
    from livekit.protocol.room import RoomConfiguration

    agent_name = f"arkenos-custom-{agent_id}"
    rule_name = f"Arkenos Custom ({agent_id[:8]})"

    lk = _get_lk()
    try:
        # Check for existing rule
        resp = await lk.sip.list_sip_dispatch_rule(ListSIPDispatchRuleRequest())
        for rule in resp.items:
            if rule.name == rule_name:
                logger.info(f"[ensure_custom_dispatch] Reusing dispatch rule {rule.sip_dispatch_rule_id} for {agent_name}")
                return rule.sip_dispatch_rule_id

        # Resolve inbound trunk ID so the rule is linked to it
        inbound_trunk_id = _state.inbound_trunk_id
        if not inbound_trunk_id:
            try:
                inbound_trunk_id = await ensure_inbound_trunk()
            except Exception:
                pass
        trunk_ids = [inbound_trunk_id] if inbound_trunk_id else []

        # Create new dispatch rule for this custom agent
        logger.info(f"[ensure_custom_dispatch] Creating dispatch rule for {agent_name}, phone={phone_number}, trunk_ids={trunk_ids}")
        new_rule = await lk.sip.create_sip_dispatch_rule(
            CreateSIPDispatchRuleRequest(
                name=rule_name,
                trunk_ids=trunk_ids,
                rule=SIPDispatchRule(
                    dispatch_rule_individual=SIPDispatchRuleIndividual(
                        room_prefix=f"sip-custom-{agent_id[:8]}-",
                    )
                ),
                room_config=RoomConfiguration(
                    agents=[RoomAgentDispatch(agent_name=agent_name)]
                ),
                inbound_numbers=[phone_number],
            )
        )
        logger.info(f"[ensure_custom_dispatch] Created dispatch rule {new_rule.sip_dispatch_rule_id} for {agent_name}")
        return new_rule.sip_dispatch_rule_id
    finally:
        await lk.aclose()


async def delete_custom_agent_dispatch_rule(agent_id: str) -> None:
    """Delete the SIP dispatch rule for a custom agent (e.g. when phone released)."""
    from livekit.api import ListSIPDispatchRuleRequest

    rule_name = f"Arkenos Custom ({agent_id[:8]})"

    lk = _get_lk()
    try:
        resp = await lk.sip.list_sip_dispatch_rule(ListSIPDispatchRuleRequest())
        for rule in resp.items:
            if rule.name == rule_name:
                from livekit.protocol.sip import DeleteSIPDispatchRuleRequest as _DelReq
                await lk.sip.delete_sip_dispatch_rule(
                    _DelReq(sip_dispatch_rule_id=rule.sip_dispatch_rule_id)
                )
                logger.info(f"[delete_custom_dispatch] Deleted dispatch rule {rule.sip_dispatch_rule_id} for agent {agent_id[:8]}")
                return
    except Exception as e:
        logger.warning(f"[delete_custom_dispatch] Could not delete rule for agent {agent_id[:8]}: {e}")
    finally:
        await lk.aclose()


async def add_number_to_inbound_trunk(phone: str) -> None:
    """Add a phone number to the inbound SIP trunk.
    Self-heals if the cached trunk ID is stale (e.g. LiveKit project changed).
    """
    from livekit.api import ListUpdate

    logger.info(f"[add_number_to_inbound_trunk] Adding number {phone} to inbound trunk")
    trunk_id = await ensure_inbound_trunk(phone)
    logger.info(f"[add_number_to_inbound_trunk] Resolved inbound trunk_id={trunk_id}")
    lk = _get_lk()
    try:
        try:
            await lk.sip.update_inbound_trunk_fields(
                trunk_id, numbers=ListUpdate(add=[phone])
            )
            logger.info(f"[add_number_to_inbound_trunk] Added {phone} to inbound trunk {trunk_id}")
        except Exception as e:
            if "not_found" in str(e).lower() or "404" in str(e):
                logger.warning(
                    f"[add_number_to_inbound_trunk] Trunk {trunk_id} not found (stale cache) — "
                    f"clearing cache and re-creating trunk"
                )
                _state.inbound_trunk_id = None
                await lk.aclose()
                # Re-create trunk and retry
                trunk_id = await ensure_inbound_trunk(phone)
                lk = _get_lk()
                await lk.sip.update_inbound_trunk_fields(
                    trunk_id, numbers=ListUpdate(add=[phone])
                )
                logger.info(f"[add_number_to_inbound_trunk] Added {phone} to new trunk {trunk_id}")
            else:
                raise
    finally:
        await lk.aclose()


async def remove_number_from_inbound_trunk(phone: str) -> None:
    """Remove a phone number from the inbound SIP trunk."""
    from livekit.api import ListUpdate

    if not _state.inbound_trunk_id:
        await ensure_inbound_trunk()

    if not _state.inbound_trunk_id:
        logger.warning("No inbound trunk found, nothing to remove from")
        return

    lk = _get_lk()
    try:
        try:
            await lk.sip.update_inbound_trunk_fields(
                _state.inbound_trunk_id, numbers=ListUpdate(remove=[phone])
            )
            logger.info(f"Removed {phone} from inbound trunk {_state.inbound_trunk_id}")
        except Exception as e:
            if "not_found" in str(e).lower() or "404" in str(e):
                logger.warning(f"[remove_number] Trunk {_state.inbound_trunk_id} stale — clearing cache")
                _state.inbound_trunk_id = None
                # Trunk doesn't exist, so the number is effectively removed
            else:
                raise
    finally:
        await lk.aclose()


async def _sync_outbound_trunk_numbers(trunk_id: str, provider_name: str | None = None) -> None:
    """Sync agent phone numbers onto the LiveKit outbound trunk.
    If provider_name is given, only syncs numbers from agents using that provider.
    """
    from app import models as _models

    db = SessionLocal()
    try:
        query = db.query(_models.Agent).filter(
            _models.Agent.phone_number.isnot(None)
        )
        if provider_name:
            query = query.filter(_models.Agent.telephony_provider == provider_name)
        agents_with_phones = query.all()
        current_numbers = {a.phone_number for a in agents_with_phones if a.phone_number}
    except Exception:
        return
    finally:
        db.close()

    if not current_numbers:
        return

    lk = _get_lk()
    try:
        from livekit.api import ListSIPOutboundTrunkRequest, ListUpdate

        resp = await lk.sip.list_sip_outbound_trunk(ListSIPOutboundTrunkRequest())
        for trunk in resp.items:
            if trunk.sip_trunk_id == trunk_id:
                trunk_numbers = set(trunk.numbers) if trunk.numbers else set()
                missing = current_numbers - trunk_numbers
                if missing:
                    await lk.sip.update_outbound_trunk_fields(
                        trunk_id, numbers=ListUpdate(add=list(missing))
                    )
                    logger.info(f"Synced {missing} to outbound trunk {trunk_id}")
                return
    except Exception as e:
        logger.warning(f"Could not sync outbound trunk numbers: {e}")
    finally:
        await lk.aclose()


async def _ensure_provider_outbound_setup(provider_name: str) -> None:
    """Ensure provider-side outbound setup is complete (e.g. voice profile attached).
    Called even on cached paths to guarantee provider config stays in sync.
    """
    if provider_name == "telnyx":
        from app.services.telephony_providers import get_provider
        db = SessionLocal()
        try:
            provider = get_provider(provider_name, db)
            await provider.configure_sip_outbound()
        finally:
            db.close()


async def ensure_outbound_trunk(provider_name: str = "twilio") -> str:
    """Ensure an outbound SIP trunk exists for the given telephony provider. Returns trunk ID.
    Uses the provider factory to get outbound SIP configuration, then creates a LiveKit
    outbound trunk pointing to the provider.
    """
    global _state

    from livekit.api import (
        CreateSIPOutboundTrunkRequest,
        ListSIPOutboundTrunkRequest,
        SIPOutboundTrunkInfo,
    )

    trunk_name = f"Arkenos Outbound ({provider_name})"
    logger.info(f"[ensure_outbound_trunk] provider_name={provider_name}, trunk_name={trunk_name}")

    # Always sync numbers even if trunk ID is cached — new numbers may have been added
    cached_id = _state.outbound_trunk_ids.get(provider_name)
    if cached_id:
        logger.info(f"[ensure_outbound_trunk] Using cached outbound trunk_id={cached_id} for provider={provider_name}")
        # Ensure provider-side setup is complete (e.g. outbound voice profile)
        await _ensure_provider_outbound_setup(provider_name)
        await _sync_outbound_trunk_numbers(cached_id, provider_name)
        return cached_id

    lk = _get_lk()
    try:
        # Check for existing LiveKit outbound trunk — reuse if valid
        resp = await lk.sip.list_sip_outbound_trunk(ListSIPOutboundTrunkRequest())
        logger.info(f"[ensure_outbound_trunk] Found {len(resp.items)} existing outbound trunks")
        existing_lk_trunk = None
        for trunk in resp.items:
            logger.info(
                f"[ensure_outbound_trunk]   trunk id={trunk.sip_trunk_id}, name={trunk.name}, "
                f"address={trunk.address}, numbers={list(trunk.numbers) if trunk.numbers else []}, "
                f"auth_username={trunk.auth_username}"
            )
            if trunk.name == trunk_name:
                existing_lk_trunk = trunk
            # Backward compat: match old "Arkenos Outbound" name for twilio
            elif provider_name == "twilio" and trunk.name == "Arkenos Outbound":
                existing_lk_trunk = trunk

        # Use provider factory to get outbound SIP config
        from app.services.telephony_providers import get_provider

        logger.info(f"[ensure_outbound_trunk] Requesting outbound config from provider '{provider_name}'")
        db = SessionLocal()
        try:
            provider = get_provider(provider_name, db)
            outbound_config = await provider.configure_sip_outbound()
        finally:
            db.close()

        logger.info(
            f"[ensure_outbound_trunk] Provider returned outbound_config: "
            f"address={outbound_config.get('address')}, auth_username={outbound_config.get('auth_username')}, "
            f"reused={outbound_config.get('reused')}, has_password={'auth_password' in outbound_config and outbound_config.get('auth_password') is not None}"
        )

        if outbound_config.get("reused") and existing_lk_trunk:
            # Provider connection exists AND LiveKit trunk exists — reuse both
            _state.outbound_trunk_ids[provider_name] = existing_lk_trunk.sip_trunk_id
            logger.info(f"Reusing existing outbound trunk: {existing_lk_trunk.sip_trunk_id}")
            await _sync_outbound_trunk_numbers(existing_lk_trunk.sip_trunk_id, provider_name)
            return existing_lk_trunk.sip_trunk_id

        if outbound_config.get("reused") and not existing_lk_trunk:
            # Provider has a stale credential connection but LiveKit trunk is gone
            # (e.g. switched LiveKit projects). Auto-delete and recreate.
            logger.warning(
                f"[ensure_outbound_trunk] Provider '{provider_name}' has stale credentials "
                f"with no matching LiveKit trunk — deleting and recreating fresh"
            )
            db = SessionLocal()
            try:
                provider = get_provider(provider_name, db)
                await provider.delete_outbound_credentials()
                outbound_config = await provider.configure_sip_outbound()
            finally:
                db.close()
            logger.info(
                f"[ensure_outbound_trunk] Recreated fresh credentials: "
                f"reused={outbound_config.get('reused')}, has_password={outbound_config.get('auth_password') is not None}"
            )

        if not outbound_config.get("reused") and existing_lk_trunk:
            # Fresh credentials from provider but stale LiveKit trunk exists —
            # delete the stale trunk so we can recreate with new credentials.
            logger.warning(
                f"[ensure_outbound_trunk] Deleting stale LiveKit outbound trunk "
                f"{existing_lk_trunk.sip_trunk_id} — provider issued fresh credentials"
            )
            from livekit.protocol.sip import DeleteSIPTrunkRequest
            await lk.sip.delete_sip_trunk(
                DeleteSIPTrunkRequest(sip_trunk_id=existing_lk_trunk.sip_trunk_id)
            )
            _state.outbound_trunk_ids.pop(provider_name, None)

        # Validate required keys in outbound config (only for new connections)
        required_keys = ("address", "auth_username", "auth_password")
        missing_keys = [k for k in required_keys if k not in outbound_config or not outbound_config[k]]
        if missing_keys:
            raise ValueError(
                f"Provider '{provider_name}' returned incomplete outbound config — "
                f"missing keys: {', '.join(missing_keys)}"
            )

        # Collect all phone numbers assigned to agents using this provider
        from app import models

        db = SessionLocal()
        try:
            agents_with_phones = db.query(models.Agent).filter(
                models.Agent.phone_number.isnot(None),
                models.Agent.telephony_provider == provider_name,
            ).all()
            numbers = [a.phone_number for a in agents_with_phones if a.phone_number]
        finally:
            db.close()

        if not numbers:
            raise ValueError("No phone numbers assigned to any agent — assign a number first")

        logger.info(
            f"[ensure_outbound_trunk] Creating LiveKit outbound trunk: name={trunk_name}, "
            f"address={outbound_config['address']}, numbers={numbers}, "
            f"auth_username={outbound_config['auth_username']}"
        )
        # Create LiveKit outbound trunk pointing to the provider
        new_trunk = await lk.sip.create_sip_outbound_trunk(
            CreateSIPOutboundTrunkRequest(
                trunk=SIPOutboundTrunkInfo(
                    name=trunk_name,
                    address=outbound_config["address"],
                    numbers=numbers,
                    auth_username=outbound_config["auth_username"],
                    auth_password=outbound_config["auth_password"],
                )
            )
        )
        _state.outbound_trunk_ids[provider_name] = new_trunk.sip_trunk_id
        logger.info(f"Created outbound trunk: {new_trunk.sip_trunk_id}")
        return new_trunk.sip_trunk_id
    finally:
        await lk.aclose()


async def delete_outbound_trunk(provider_name: str) -> None:
    """Delete the LiveKit outbound trunk for a given provider and clear its cached ID.
    Used by force_outbound to reset stale trunks before recreating.
    """
    from livekit.api import ListSIPOutboundTrunkRequest
    from livekit.protocol.sip import DeleteSIPTrunkRequest

    trunk_name = f"Arkenos Outbound ({provider_name})"
    lk = _get_lk()
    try:
        resp = await lk.sip.list_sip_outbound_trunk(ListSIPOutboundTrunkRequest())
        for trunk in resp.items:
            if trunk.name == trunk_name or (provider_name == "twilio" and trunk.name == "Arkenos Outbound"):
                logger.info(f"[delete_outbound_trunk] Deleting LiveKit outbound trunk {trunk.sip_trunk_id}")
                await lk.sip.delete_sip_trunk(DeleteSIPTrunkRequest(sip_trunk_id=trunk.sip_trunk_id))
                _state.outbound_trunk_ids.pop(provider_name, None)
    finally:
        await lk.aclose()


def get_sip_uri() -> str:
    """Return the SIP URI for routing calls to LiveKit.

    Resolution order:
      1. livekit_sip_uri (explicit — most reliable, from LiveKit dashboard)
      2. twilio_sip_domain (legacy explicit override)
      3. Derive from livekit_url: wss://xyz.livekit.cloud -> xyz.sip.livekit.cloud
         NOTE: This derivation is NOT always correct — LiveKit's SIP subdomain
         can differ from the WebSocket subdomain. Users should set livekit_sip_uri
         explicitly if calls don't route.
    """
    if _state.inbound_sip_uri:
        logger.info(f"[get_sip_uri] Returning cached SIP URI: {_state.inbound_sip_uri}")
        return _state.inbound_sip_uri

    db = SessionLocal()
    try:
        explicit_sip_uri = get_key(db, "livekit_sip_uri")
        sip_domain = get_key(db, "twilio_sip_domain")
        lk_url = get_key(db, "livekit_url")
    finally:
        db.close()

    logger.info(f"[get_sip_uri] livekit_sip_uri={explicit_sip_uri}, twilio_sip_domain={sip_domain}, livekit_url={lk_url}")

    # 1. Explicit livekit_sip_uri (from dashboard or .env)
    if explicit_sip_uri:
        # Strip sip: prefix if user included it
        uri = explicit_sip_uri.replace("sip:", "").strip()
        _state.inbound_sip_uri = uri
        logger.info(f"[get_sip_uri] Using explicit livekit_sip_uri: {uri}")
        return _state.inbound_sip_uri

    # 2. Legacy twilio_sip_domain override
    if sip_domain:
        _state.inbound_sip_uri = sip_domain
        logger.info(f"[get_sip_uri] Using explicit twilio_sip_domain: {_state.inbound_sip_uri}")
        return _state.inbound_sip_uri

    # 3. Derive from livekit_url (may not match — LiveKit SIP subdomain can differ)
    if lk_url:
        host = lk_url.replace("wss://", "").replace("ws://", "").rstrip("/")
        parts = host.split(".", 1)
        if len(parts) == 2:
            _state.inbound_sip_uri = f"{parts[0]}.sip.{parts[1]}"
            logger.warning(
                f"[get_sip_uri] Derived SIP URI from livekit_url: {_state.inbound_sip_uri} — "
                f"this may be WRONG if your LiveKit SIP subdomain differs. "
                f"Set livekit_sip_uri in API Keys to fix."
            )
            return _state.inbound_sip_uri

    logger.warning("[get_sip_uri] Could not determine SIP URI — set livekit_sip_uri in API Keys")
    return ""
