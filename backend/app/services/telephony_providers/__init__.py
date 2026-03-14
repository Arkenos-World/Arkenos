from .base import TelephonyProvider
from .twilio_provider import TwilioProvider


def get_provider(provider_name: str, db) -> TelephonyProvider:
    if provider_name == "twilio":
        return TwilioProvider(db)
    elif provider_name == "telnyx":
        from .telnyx_provider import TelnyxProvider
        return TelnyxProvider(db)
    raise ValueError(f"Unknown telephony provider: {provider_name}")
