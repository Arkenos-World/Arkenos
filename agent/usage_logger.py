"""
Usage event logger for cost tracking.

Sends STT, LLM, and TTS usage events to the backend API.
All logging is fire-and-forget — failures are logged but never crash the call.

Backend expects: {session_id, user_id, agent_id, event_type, provider, quantity, unit_cost, total_cost}
"""

import asyncio
import logging
from decimal import Decimal

import httpx

logger = logging.getLogger("usage-logger")

# Cost rates — mirrors backend/app/cost_rates.py
# STT: cost per minute of audio
STT_RATES = {
    "deepgram": Decimal("0.0077"),
    "assemblyai": Decimal("0.0078"),
    "elevenlabs": Decimal("0.0167"),
}

# LLM: cost per 1K tokens (blended input+output)
LLM_RATES = {
    "google": Decimal("0.00086"),
    "gemini": Decimal("0.00086"),
}

# TTS: cost per character
TTS_RATES = {
    "resemble": Decimal("0.00004"),
}


async def log_usage_event(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    event_type: str,
    provider: str,
    quantity: float,
    unit_cost: float,
    total_cost: float,
) -> None:
    """Send a single usage event to the backend. Never raises."""
    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "agent_id": agent_id,
        "event_type": event_type,
        "provider": provider,
        "quantity": quantity,
        "unit_cost": unit_cost,
        "total_cost": total_cost,
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{backend_url}/usage/events",
                json=payload,
                timeout=5,
            )
            if response.status_code >= 400:
                logger.warning(
                    f"Usage event rejected: {response.status_code} {response.text} "
                    f"| payload: event_type={event_type} provider={provider} qty={quantity} cost={total_cost}"
                )
            else:
                logger.debug(f"Logged {event_type} usage: qty={quantity}, cost=${total_cost:.6f}")
    except Exception as e:
        logger.warning(f"Failed to log {event_type} usage event: {e}")


def log_stt_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    audio_duration: float,
) -> None:
    """Fire-and-forget: log STT usage. Quantity = minutes of audio."""
    minutes = audio_duration / 60.0
    unit_cost = float(STT_RATES.get(provider.lower(), Decimal("0.0078")))
    total_cost = minutes * unit_cost
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="stt_minutes",
            provider=provider,
            quantity=round(minutes, 4),
            unit_cost=unit_cost,
            total_cost=round(total_cost, 6),
        )
    )


def log_llm_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    input_tokens: int,
    output_tokens: int,
) -> None:
    """Fire-and-forget: log LLM usage. Quantity = total tokens (input + output)."""
    total_tokens = input_tokens + output_tokens
    unit_cost = float(LLM_RATES.get(provider.lower(), Decimal("0.00086")))
    total_cost = (total_tokens / 1000.0) * unit_cost
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="llm_tokens",
            provider=provider,
            quantity=total_tokens,
            unit_cost=unit_cost,
            total_cost=round(total_cost, 6),
        )
    )


def log_tts_usage(
    backend_url: str,
    session_id: str,
    user_id: str,
    agent_id: str | None,
    provider: str,
    character_count: int,
) -> None:
    """Fire-and-forget: log TTS usage. Quantity = character count."""
    unit_cost = float(TTS_RATES.get(provider.lower(), Decimal("0.00004")))
    total_cost = character_count * unit_cost
    asyncio.create_task(
        log_usage_event(
            backend_url=backend_url,
            session_id=session_id,
            user_id=user_id,
            agent_id=agent_id,
            event_type="tts_characters",
            provider=provider,
            quantity=character_count,
            unit_cost=unit_cost,
            total_cost=round(total_cost, 6),
        )
    )
