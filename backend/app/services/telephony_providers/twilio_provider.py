"""
TwilioProvider — Twilio implementation of the TelephonyProvider interface.
Extracted from telephony_provisioning.py and telephony.py router.
"""

import logging
import secrets

from .base import TelephonyProvider
from app.services.config_resolver import get_key

logger = logging.getLogger("telephony.twilio_provider")


class TwilioProvider(TelephonyProvider):
    def __init__(self, db):
        super().__init__(db)
        self._client = None
        self.twilio_trunk_sid: str | None = None
        self.credential_list_sid: str | None = None

    def _get_client(self):
        """Create or return cached Twilio client from DB/env keys."""
        if self._client is None:
            from twilio.rest import Client

            account_sid = get_key(self.db, "twilio_account_sid")
            auth_token = get_key(self.db, "twilio_auth_token")
            if not account_sid or not auth_token:
                raise ValueError("Twilio credentials not configured")
            self._client = Client(account_sid, auth_token)
        return self._client

    async def search_numbers(self, country: str, area_code: str, limit: int = 20) -> list[dict]:
        """Search available Twilio phone numbers."""
        client = self._get_client()

        search_params = {"limit": limit}
        if area_code:
            search_params["area_code"] = area_code

        available = client.available_phone_numbers(country).local.list(**search_params)

        return [
            {
                "phone_number": num.phone_number,
                "friendly_name": num.friendly_name,
                "locality": num.locality,
                "region": num.region,
            }
            for num in available
        ]

    async def buy_number(self, phone_number: str) -> dict:
        """Purchase a Twilio phone number. Returns {sid, phone_number}."""
        client = self._get_client()
        incoming = client.incoming_phone_numbers.create(phone_number=phone_number)
        return {
            "sid": incoming.sid,
            "phone_number": incoming.phone_number,
        }

    async def validate_ownership(self, phone_number: str) -> str | None:
        """Check if number is owned by this Twilio account. Returns Twilio SID or None."""
        client = self._get_client()
        numbers = client.incoming_phone_numbers.list(phone_number=phone_number)
        if numbers:
            return numbers[0].sid
        return None

    async def configure_sip_inbound(self, sip_uri: str) -> dict:
        """Create or reuse a Twilio Elastic SIP Trunk with LiveKit origination URI.
        Returns {"trunk_id": str, "stale_uri_fixed": bool, "stale_uri": str|None}.
        """
        stale_uri_fixed = False
        stale_uri = None

        client = self._get_client()

        # Check for existing trunk (reuse-first pattern)
        existing_trunk = None
        if self.twilio_trunk_sid:
            try:
                existing_trunk = client.trunking.v1.trunks(self.twilio_trunk_sid).fetch()
            except Exception:
                self.twilio_trunk_sid = None

        if not existing_trunk:
            trunks = client.trunking.v1.trunks.list()
            for trunk in trunks:
                if trunk.friendly_name == "Arkenos Inbound":
                    existing_trunk = trunk
                    self.twilio_trunk_sid = trunk.sid
                    logger.info(f"Reusing existing Twilio Elastic SIP Trunk: {trunk.sid}")
                    break

        if existing_trunk:
            # Verify origination URIs point to the correct SIP URI
            if sip_uri:
                expected_sip_url = f"sip:{sip_uri}"
                orig_urls = client.trunking.v1.trunks(existing_trunk.sid).origination_urls.list()
                has_correct_uri = False
                for orig in orig_urls:
                    if orig.sip_url == expected_sip_url:
                        has_correct_uri = True
                    elif orig.sip_url and ".sip.livekit.cloud" in orig.sip_url:
                        # Stale origination URI pointing to old LiveKit project — remove and replace
                        old_url = orig.sip_url
                        logger.warning(
                            f"Removing stale origination URI {old_url} from trunk {existing_trunk.sid} "
                            f"(expected {expected_sip_url}) — LiveKit project may have changed"
                        )
                        client.trunking.v1.trunks(existing_trunk.sid).origination_urls(orig.sid).delete()
                        logger.info(f"Deleted stale origination URI {old_url} (sid={orig.sid})")
                        stale_uri_fixed = True
                        stale_uri = old_url

                if not has_correct_uri:
                    logger.info(f"Adding correct origination URI {expected_sip_url} to trunk {existing_trunk.sid}")
                    client.trunking.v1.trunks(existing_trunk.sid).origination_urls.create(
                        friendly_name="LiveKit SIP",
                        sip_url=expected_sip_url,
                        weight=10,
                        priority=10,
                        enabled=True,
                    )
                    logger.info(f"Added origination URI {expected_sip_url} to trunk {existing_trunk.sid}")

            return {"trunk_id": existing_trunk.sid, "stale_uri_fixed": stale_uri_fixed, "stale_uri": stale_uri}

        # Create new Elastic SIP Trunk
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

        self.twilio_trunk_sid = trunk.sid
        logger.info(f"Created Twilio Elastic SIP Trunk: {trunk.sid} -> sip:{sip_uri}")
        return {"trunk_id": trunk.sid, "stale_uri_fixed": False, "stale_uri": None}

    async def associate_number_with_sip(self, number_sid: str) -> None:
        """Associate a Twilio phone number with the Elastic SIP Trunk.
        Routes inbound calls directly to LiveKit via SIP origination.
        """
        trunk_sid = self.twilio_trunk_sid
        if not trunk_sid:
            # Ensure the trunk exists first
            result = await self.configure_sip_inbound("")
            trunk_sid = result.get("trunk_id") if isinstance(result, dict) else result
            if not trunk_sid:
                raise ValueError("No Twilio SIP trunk available")

        client = self._get_client()

        # Check if already associated (reuse-first)
        existing = client.trunking.v1.trunks(trunk_sid).phone_numbers.list()
        for num in existing:
            if num.sid == number_sid:
                logger.info(f"Number {number_sid} already associated with trunk {trunk_sid}")
                return

        client.trunking.v1.trunks(trunk_sid).phone_numbers.create(
            phone_number_sid=number_sid,
        )
        logger.info(f"Associated number {number_sid} with Twilio trunk {trunk_sid}")

    async def disassociate_number_from_sip(self, number_sid: str) -> None:
        """Remove a phone number from the Twilio Elastic SIP Trunk."""
        if not self.twilio_trunk_sid:
            # Try to find existing trunk
            client = self._get_client()
            trunks = client.trunking.v1.trunks.list()
            for trunk in trunks:
                if trunk.friendly_name == "Arkenos Inbound":
                    self.twilio_trunk_sid = trunk.sid
                    break

        if not self.twilio_trunk_sid:
            logger.warning("No Twilio SIP trunk found, nothing to disassociate from")
            return

        client = self._get_client()

        try:
            client.trunking.v1.trunks(self.twilio_trunk_sid).phone_numbers(number_sid).delete()
            logger.info(f"Disassociated number {number_sid} from trunk {self.twilio_trunk_sid}")
        except Exception as e:
            logger.warning(f"Could not disassociate number from trunk: {e}")

    async def configure_sip_outbound(self) -> dict:
        """Set up Twilio-side outbound termination (credential list + termination domain).
        Returns {address, auth_username, auth_password, reused}.

        When reusing an existing credential list, `reused=True` and
        `auth_password=None` — the existing LiveKit trunk already has
        the credentials, so the caller should skip trunk recreation.
        """
        client = self._get_client()
        username = "arkenos-lk"

        # Find or create credential list for LiveKit -> Twilio auth (reuse-first)
        cred_list = None
        reused = False
        for cl in client.sip.credential_lists.list():
            if cl.friendly_name == "Arkenos LiveKit":
                cred_list = cl
                self.credential_list_sid = cl.sid
                reused = True
                logger.info(f"Reusing existing credential list: {cl.sid}")
                break

        if not cred_list:
            password = secrets.token_urlsafe(32)
            cred_list = client.sip.credential_lists.create(
                friendly_name="Arkenos LiveKit"
            )
            cred_list.credentials.create(username=username, password=password)
            self.credential_list_sid = cred_list.sid

        # Reuse existing Twilio Elastic SIP Trunk (trial allows only one)
        trunk_sid = self.twilio_trunk_sid
        if not trunk_sid:
            # Try to find existing trunk
            trunks = client.trunking.v1.trunks.list()
            for trunk in trunks:
                if trunk.friendly_name == "Arkenos Inbound":
                    trunk_sid = trunk.sid
                    self.twilio_trunk_sid = trunk_sid
                    break

        if not trunk_sid:
            raise ValueError("No Twilio SIP trunk found — configure inbound first")

        trunk_obj = client.trunking.v1.trunks(trunk_sid).fetch()

        # Enable termination by setting a domain name if not already set
        if not trunk_obj.domain_name:
            tw_sid = get_key(self.db, "twilio_account_sid")
            domain_name = f"arkenos-{tw_sid[-6:].lower()}.pstn.twilio.com"
            client.trunking.v1.trunks(trunk_sid).update(
                domain_name=domain_name
            )
            termination_uri = domain_name
            logger.info(f"Set termination domain: {termination_uri}")
        else:
            termination_uri = trunk_obj.domain_name

        # Add credential list for termination auth
        try:
            client.trunking.v1.trunks(trunk_sid).credentials_lists.create(
                credential_list_sid=cred_list.sid
            )
        except Exception as e:
            logger.warning(f"Could not add credential list to trunk (may already exist): {e}")

        if reused:
            return {
                "address": termination_uri,
                "auth_username": username,
                "auth_password": None,
                "reused": True,
            }

        return {
            "address": termination_uri,
            "auth_username": username,
            "auth_password": password,
            "reused": False,
        }

    async def test_connection(self) -> bool:
        """Validate Twilio credentials by fetching account info."""
        try:
            client = self._get_client()
            account = client.api.accounts(
                get_key(self.db, "twilio_account_sid")
            ).fetch()
            return account is not None
        except Exception as e:
            logger.error(f"Twilio connection test failed: {e}")
            return False
