"""
TelnyxProvider — Telnyx implementation of the TelephonyProvider interface.
Uses the Telnyx REST API v2 directly via httpx.

Telnyx SIP pipeline:
  Inbound:  FQDN Connection + FQDN record pointing to LiveKit SIP URI
  Outbound: Credential Connection with username/password for LiveKit → sip.telnyx.com
  Numbers:  Assigned to the FQDN connection via connection_id
"""

import logging

import httpx

from .base import TelephonyProvider
from app.services.config_resolver import get_key

logger = logging.getLogger("telephony.telnyx_provider")

TELNYX_API_BASE = "https://api.telnyx.com/v2"


class TelnyxProvider(TelephonyProvider):
    def __init__(self, db):
        super().__init__(db)
        self._api_key: str | None = None
        self.connection_id: str | None = None

    def _get_api_key(self) -> str:
        """Resolve Telnyx API key from DB/env."""
        if self._api_key is None:
            key = get_key(self.db, "telnyx_api_key")
            if not key:
                raise ValueError("Telnyx API key not configured")
            self._api_key = key
        return self._api_key

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_api_key()}",
            "Content-Type": "application/json",
        }

    async def search_numbers(self, country: str, area_code: str, limit: int = 20) -> list[dict]:
        """Search available Telnyx phone numbers."""
        params = {
            "filter[country_code]": country,
            "filter[limit]": limit,
        }
        if area_code:
            params["filter[national_destination_code]"] = area_code

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/available_phone_numbers",
                headers=self._headers(),
                params=params,
                timeout=15,
            )

        if resp.status_code != 200:
            raise ValueError(f"Telnyx number search failed ({resp.status_code}): {resp.text}")

        data = resp.json().get("data", [])
        return [
            {
                "phone_number": num.get("phone_number", ""),
                "friendly_name": num.get("phone_number", ""),
                "locality": num.get("locality", ""),
                "region": num.get("region_information", [{}])[0].get("region_name", "")
                if num.get("region_information")
                else "",
            }
            for num in data
        ]

    async def buy_number(self, phone_number: str) -> dict:
        """Purchase a Telnyx phone number. Returns {sid, phone_number}.
        The sid is the phone number RESOURCE ID (not the order line item ID).
        """
        payload = {
            "phone_numbers": [{"phone_number": phone_number}],
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{TELNYX_API_BASE}/number_orders",
                headers=self._headers(),
                json=payload,
                timeout=30,
            )

        if resp.status_code not in (200, 201):
            raise ValueError(f"Telnyx number purchase failed ({resp.status_code}): {resp.text}")

        order_data = resp.json().get("data", {})
        phone_numbers = order_data.get("phone_numbers", [])
        if not phone_numbers:
            raise ValueError("Telnyx number order returned no phone numbers")

        # The order returns order-line-item IDs, not phone number resource IDs.
        # We need the resource ID for PATCH /v2/phone_numbers/{id}.
        # Look up the actual phone number resource after purchase.
        import asyncio
        resource_id = None
        for attempt in range(5):
            if attempt > 0:
                await asyncio.sleep(1)  # Brief wait for provisioning
            resource_id = await self.validate_ownership(phone_number)
            if resource_id:
                break

        if not resource_id:
            raise ValueError(
                f"Could not resolve phone number resource ID for {phone_number} after purchase. "
                f"The number was ordered successfully but is not yet available in the account. "
                f"Please retry assignment in a few seconds."
            )

        return {
            "sid": resource_id,
            "phone_number": phone_numbers[0].get("phone_number", phone_number),
        }

    async def validate_ownership(self, phone_number: str) -> str | None:
        """Check if number is owned by this Telnyx account. Returns Telnyx number ID or None."""
        params = {
            "filter[phone_number]": phone_number,
        }

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/phone_numbers",
                headers=self._headers(),
                params=params,
                timeout=15,
            )

        if resp.status_code != 200:
            logger.warning(f"Telnyx ownership check failed ({resp.status_code}): {resp.text}")
            return None

        data = resp.json().get("data", [])
        if data:
            return data[0].get("id")
        return None

    async def _find_connection(self) -> str | None:
        """Find existing 'Arkenos Inbound' FQDN connection. Returns connection ID or None."""
        headers = self._headers()

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/fqdn_connections",
                headers=headers,
                timeout=15,
            )

        if resp.status_code != 200:
            return None

        connections = resp.json().get("data", [])
        for conn in connections:
            if conn.get("connection_name") == "Arkenos Inbound":
                self.connection_id = conn["id"]
                logger.info(f"Reusing existing Telnyx FQDN Connection: {conn['id']}")
                return conn["id"]

        return None

    async def configure_sip_inbound(self, sip_uri: str) -> dict:
        """Create or reuse a Telnyx FQDN Connection pointing to LiveKit SIP URI.
        Always verifies the FQDN record exists on the connection.
        Returns {"trunk_id": str, "stale_uri_fixed": bool, "stale_uri": str|None}.
        """
        logger.info(f"[configure_sip_inbound] sip_uri={sip_uri}, cached connection_id={self.connection_id}")
        headers = self._headers()

        if self.connection_id:
            conn_id = self.connection_id
            logger.info(f"[configure_sip_inbound] Using cached connection_id={conn_id}")
        else:
            # Reuse-first: check for existing connection
            conn_id = await self._find_connection()
            logger.info(f"[configure_sip_inbound] _find_connection returned: {conn_id}")

        if not conn_id:
            # Create new FQDN Connection
            if not sip_uri:
                raise ValueError("Cannot determine LiveKit SIP URI — set LIVEKIT_URL")

            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{TELNYX_API_BASE}/fqdn_connections",
                    headers=headers,
                    json={
                        "connection_name": "Arkenos Inbound",
                        "active": True,
                        "transport_protocol": "TCP",
                        "anchorsite_override": "Latency",
                        "inbound": {
                            "ani_number_format": "+E.164",
                            "dnis_number_format": "+e164",
                        },
                    },
                    timeout=15,
                )

            if resp.status_code not in (200, 201):
                raise ValueError(f"Failed to create Telnyx FQDN Connection ({resp.status_code}): {resp.text}")

            conn_data = resp.json().get("data", {})
            conn_id = conn_data["id"]
            self.connection_id = conn_id
            logger.info(f"Created Telnyx FQDN Connection: {conn_id}")

        # Always verify FQDN record exists — add it if missing, remove stale ones
        if not sip_uri:
            raise ValueError(
                "SIP URI is required to configure Telnyx inbound routing — "
                "set LIVEKIT_URL or twilio_sip_domain in settings"
            )

        stale_uri_fixed = False
        stale_uri = None

        if sip_uri:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{TELNYX_API_BASE}/fqdns",
                    headers=headers,
                    params={"filter[connection_id]": conn_id},
                    timeout=15,
                )

            has_fqdn = False
            if resp.status_code == 200:
                fqdns = resp.json().get("data", [])
                logger.info(f"[configure_sip_inbound] Found {len(fqdns)} FQDN records on connection {conn_id}")
                for f in fqdns:
                    logger.info(f"[configure_sip_inbound]   FQDN: id={f.get('id')}, fqdn={f.get('fqdn')}, port={f.get('port')}")
                    if f.get("fqdn") == sip_uri:
                        has_fqdn = True
                    elif f.get("fqdn", "").endswith(".sip.livekit.cloud"):
                        # Stale FQDN pointing to old LiveKit project — remove it
                        stale_id = f.get("id")
                        stale_fqdn = f.get("fqdn")
                        logger.warning(
                            f"Removing stale FQDN {stale_fqdn} from connection {conn_id} "
                            f"(expected {sip_uri}) — LiveKit project may have changed"
                        )
                        async with httpx.AsyncClient() as client:
                            del_resp = await client.delete(
                                f"{TELNYX_API_BASE}/fqdns/{stale_id}",
                                headers=headers,
                                timeout=15,
                            )
                        if del_resp.status_code in (200, 204):
                            logger.info(f"Deleted stale FQDN {stale_fqdn} (id={stale_id})")
                            stale_uri_fixed = True
                            stale_uri = stale_fqdn
                        else:
                            logger.error(f"Failed to delete stale FQDN {stale_id}: {del_resp.status_code} {del_resp.text}")

            if not has_fqdn:
                logger.info(f"[configure_sip_inbound] FQDN {sip_uri} not found on connection {conn_id}, creating it")
                async with httpx.AsyncClient() as client:
                    resp = await client.post(
                        f"{TELNYX_API_BASE}/fqdns",
                        headers=headers,
                        json={
                            "connection_id": conn_id,
                            "fqdn": sip_uri,
                            "dns_record_type": "a",
                            "port": 5060,
                        },
                        timeout=15,
                    )

                if resp.status_code not in (200, 201):
                    raise ValueError(f"Failed to add FQDN to connection ({resp.status_code}): {resp.text}")

                logger.info(f"Added FQDN {sip_uri} to connection {conn_id}")

        return {"trunk_id": conn_id, "stale_uri_fixed": stale_uri_fixed, "stale_uri": stale_uri}

    async def associate_number_with_sip(self, number_sid: str) -> None:
        """Assign the Telnyx number's connection_id to the FQDN Connection and enable voice."""
        logger.info(f"[associate_number_with_sip] number_sid={number_sid}, cached connection_id={self.connection_id}")
        conn_id = self.connection_id
        if not conn_id:
            conn_id = await self._find_connection()
            if not conn_id:
                raise ValueError("No Telnyx FQDN Connection available — run configure_sip_inbound first")

        headers = self._headers()

        # Check current assignment (reuse-first)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/phone_numbers/{number_sid}",
                headers=headers,
                timeout=15,
            )

        if resp.status_code == 200:
            num_data = resp.json().get("data", {})
            current_conn = num_data.get("connection_id")
            logger.info(
                f"[associate_number_with_sip] Current connection assignment for {number_sid}: "
                f"connection_id={current_conn}, phone_number={num_data.get('phone_number')}"
            )
            if current_conn == conn_id:
                logger.info(f"[associate_number_with_sip] Number {number_sid} already associated with connection {conn_id}")
                # Still ensure voice is enabled
                await self._enable_voice(number_sid, conn_id)
                return
        else:
            logger.warning(f"[associate_number_with_sip] GET phone_numbers/{number_sid} returned {resp.status_code}: {resp.text}")

        # Update number's connection_id
        logger.info(f"[associate_number_with_sip] Updating number {number_sid} connection_id to {conn_id}")
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{TELNYX_API_BASE}/phone_numbers/{number_sid}",
                headers=headers,
                json={"connection_id": conn_id},
                timeout=15,
            )

        if resp.status_code != 200:
            raise ValueError(f"Failed to associate number with connection ({resp.status_code}): {resp.text}")

        logger.info(f"[associate_number_with_sip] Update response: {resp.json()}")

        logger.info(f"Associated number {number_sid} with Telnyx connection {conn_id}")

        # Enable voice on the number (required by Telnyx — not auto-enabled after purchase)
        await self._enable_voice(number_sid, conn_id)

    async def _enable_voice(self, number_sid: str, conn_id: str) -> None:
        """Enable voice capability on a Telnyx phone number."""
        logger.info(f"[_enable_voice] Enabling voice on number_sid={number_sid}, connection_id={conn_id}")
        headers = self._headers()
        payload = {
            "connection_id": conn_id,
            "tech_prefix_enabled": False,
        }
        logger.info(f"[_enable_voice] PATCH /phone_numbers/{number_sid}/voice payload={payload}")
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{TELNYX_API_BASE}/phone_numbers/{number_sid}/voice",
                headers=headers,
                json=payload,
                timeout=15,
            )
        if resp.status_code == 200:
            logger.info(f"[_enable_voice] Enabled voice on number {number_sid}")
            logger.info(f"[_enable_voice] Response: {resp.json()}")
        else:
            raise ValueError(
                f"Failed to enable voice on Telnyx number {number_sid} "
                f"({resp.status_code}): {resp.text}"
            )

    async def disassociate_number_from_sip(self, number_sid: str) -> None:
        """Remove connection assignment from a Telnyx phone number."""
        headers = self._headers()

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    f"{TELNYX_API_BASE}/phone_numbers/{number_sid}",
                    headers=headers,
                    json={"connection_id": None},
                    timeout=15,
                )

            if resp.status_code == 200:
                logger.info(f"Disassociated number {number_sid} from SIP connection")
            else:
                logger.warning(f"Could not disassociate number ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.warning(f"Could not disassociate number from connection: {e}")

    async def _ensure_outbound_voice_profile(self, connection_id: str) -> str:
        """Create or reuse an Outbound Voice Profile and attach the connection to it.
        Telnyx REQUIRES an outbound voice profile for any outbound calling.
        Returns the profile ID.
        """
        headers = self._headers()
        profile_name = "Arkenos Outbound"

        # Check for ANY existing profile (reuse-first — many accounts are limited to 1)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/outbound_voice_profiles",
                headers=headers,
                timeout=15,
            )

        if resp.status_code == 200:
            profiles = resp.json().get("data", [])
            if profiles:
                # Reuse the first available profile (prefer exact name match)
                profile = next(
                    (p for p in profiles if p.get("name") == profile_name),
                    profiles[0],
                )
                profile_id = profile["id"]
                logger.info(
                    f"[_ensure_outbound_voice_profile] Reusing existing profile: "
                    f"{profile_id} (name={profile.get('name')})"
                )
                await self._attach_connection_to_profile(profile_id, connection_id)
                return profile_id

        # Create new outbound voice profile
        logger.info(f"[_ensure_outbound_voice_profile] Creating new outbound voice profile")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{TELNYX_API_BASE}/outbound_voice_profiles",
                headers=headers,
                json={
                    "name": profile_name,
                    "traffic_type": "conversational",
                    "service_plan": "global",
                    "enabled": True,
                    "whitelisted_destinations": ["US", "CA"],
                    "concurrent_call_limit": None,
                },
                timeout=15,
            )

        if resp.status_code not in (200, 201):
            raise ValueError(f"Failed to create outbound voice profile ({resp.status_code}): {resp.text}")

        profile_data = resp.json().get("data", {})
        profile_id = profile_data["id"]
        logger.info(f"[_ensure_outbound_voice_profile] Created profile: {profile_id}")

        # Attach connection to the new profile
        await self._attach_connection_to_profile(profile_id, connection_id)

        return profile_id

    async def _attach_connection_to_profile(self, profile_id: str, connection_id: str) -> None:
        """Set the outbound_voice_profile_id on a credential connection."""
        headers = self._headers()

        # Check current profile assignment
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/credential_connections/{connection_id}",
                headers=headers,
                timeout=15,
            )

        if resp.status_code == 200:
            conn_data = resp.json().get("data", {})
            logger.info(f"[_attach_connection_to_profile] Current connection data outbound field: {conn_data.get('outbound')}")
            current_profile = (conn_data.get("outbound", {}) or {}).get("outbound_voice_profile_id")
            if current_profile == profile_id:
                logger.info(f"[_attach_connection_to_profile] Connection {connection_id} already attached to profile {profile_id}")
                return
            logger.info(f"[_attach_connection_to_profile] Current profile: {current_profile}, target: {profile_id}")
        else:
            logger.warning(f"[_attach_connection_to_profile] GET connection failed ({resp.status_code}): {resp.text}")

        # Update connection with the profile ID (must be nested under "outbound")
        patch_body = {"outbound": {"outbound_voice_profile_id": profile_id}}
        logger.info(f"[_attach_connection_to_profile] PATCH credential_connections/{connection_id} body={patch_body}")
        async with httpx.AsyncClient() as client:
            resp = await client.patch(
                f"{TELNYX_API_BASE}/credential_connections/{connection_id}",
                headers=headers,
                json=patch_body,
                timeout=15,
            )

        logger.info(f"[_attach_connection_to_profile] PATCH response ({resp.status_code}): {resp.text}")
        if resp.status_code != 200:
            raise ValueError(
                f"Failed to attach connection {connection_id} to outbound voice profile {profile_id} "
                f"({resp.status_code}): {resp.text}"
            )

    async def configure_sip_outbound(self) -> dict:
        """Set up outbound calling via Telnyx.
        Returns {address, auth_username, auth_password, reused}.

        Telnyx uses a SEPARATE credential connection for outbound auth
        (FQDN connections are for inbound only). Flow:
          1. Create/reuse a credential connection ("Arkenos Outbound")
             with a username and password
          2. Create/reuse an Outbound Voice Profile and attach the connection
          3. LiveKit outbound trunk uses sip.telnyx.com with those credentials

        When reusing an existing connection, `reused=True` and
        `auth_password=None` — the existing LiveKit trunk already has
        the credentials, so the caller should skip trunk recreation.
        """
        headers = self._headers()
        username = "arkenoslk"  # 4-32 alphanumeric, no spaces/special chars

        # Check for existing credential connection (reuse-first)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{TELNYX_API_BASE}/credential_connections",
                headers=headers,
                timeout=15,
            )

        existing_conn_id = None
        if resp.status_code == 200:
            connections = resp.json().get("data", [])
            logger.info(f"[configure_sip_outbound] Found {len(connections)} existing credential connections")
            for conn in connections:
                logger.info(
                    f"[configure_sip_outbound]   conn id={conn.get('id')}, name={conn.get('connection_name')}, "
                    f"user_name={conn.get('user_name')}, active={conn.get('active')}"
                )
                if conn.get("connection_name") == "Arkenos Outbound":
                    existing_conn_id = conn["id"]
                    break

        if existing_conn_id:
            logger.info(f"[configure_sip_outbound] Reusing existing credential connection: {existing_conn_id}")
            # Ensure outbound voice profile exists and connection is attached
            await self._ensure_outbound_voice_profile(existing_conn_id)
            return {
                "address": "sip.telnyx.com",
                "auth_username": username,
                "auth_password": None,
                "reused": True,
            }

        # Create new credential connection for outbound
        logger.info(f"[configure_sip_outbound] No existing 'Arkenos Outbound' credential connection found, creating new one")
        import secrets
        password = secrets.token_urlsafe(32)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{TELNYX_API_BASE}/credential_connections",
                headers=headers,
                json={
                    "connection_name": "Arkenos Outbound",
                    "user_name": username,
                    "password": password,
                    "active": True,
                },
                timeout=15,
            )

        if resp.status_code not in (200, 201):
            raise ValueError(f"Failed to create credential connection ({resp.status_code}): {resp.text}")

        conn_data = resp.json().get("data", {})
        new_conn_id = conn_data.get("id")
        logger.info(f"Created Telnyx credential connection: {new_conn_id}")

        # Ensure outbound voice profile exists and attach the new connection
        await self._ensure_outbound_voice_profile(new_conn_id)

        return {
            "address": "sip.telnyx.com",
            "auth_username": username,
            "auth_password": password,
            "reused": False,
        }

    async def test_connection(self) -> bool:
        """Validate Telnyx API key by fetching account balance."""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{TELNYX_API_BASE}/balance",
                    headers=self._headers(),
                    timeout=10,
                )
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Telnyx connection test failed: {e}")
            return False

