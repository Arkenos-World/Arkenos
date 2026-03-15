from abc import ABC, abstractmethod


class TelephonyProvider(ABC):
    def __init__(self, db):
        self.db = db

    @abstractmethod
    async def search_numbers(self, country: str, area_code: str, limit: int = 20) -> list[dict]:
        """Search available phone numbers. Returns list of {phone_number, friendly_name, locality, region}."""

    @abstractmethod
    async def buy_number(self, phone_number: str) -> dict:
        """Purchase a phone number. Returns {sid, phone_number}."""

    @abstractmethod
    async def validate_ownership(self, phone_number: str) -> str | None:
        """Check if number is owned by this account. Returns provider SID or None."""

    @abstractmethod
    async def configure_sip_inbound(self, sip_uri: str) -> dict:
        """Set up provider-side SIP routing to LiveKit.
        Returns {"trunk_id": str, "stale_uri_fixed": bool, "stale_uri": str|None}.
        """

    @abstractmethod
    async def associate_number_with_sip(self, number_sid: str) -> None:
        """Link a purchased number to the provider SIP trunk/connection."""

    @abstractmethod
    async def disassociate_number_from_sip(self, number_sid: str) -> None:
        """Unlink a number from the provider SIP trunk/connection."""

    @abstractmethod
    async def configure_sip_outbound(self) -> dict:
        """Set up provider-side outbound termination. Returns {address, auth_username, auth_password}."""

    @abstractmethod
    async def test_connection(self) -> bool:
        """Validate provider credentials."""
