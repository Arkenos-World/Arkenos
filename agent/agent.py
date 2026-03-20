"""
Arkenos Voice Agent

A LiveKit-based voice agent using:
- Deepgram for Speech-to-Text
- Google Gemini for LLM
- Resemble AI for Text-to-Speech
"""

import asyncio
import json
import logging
import os
import signal
import sys
import time
import threading

import httpx
from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, RunContext, function_tool
from livekit.agents.metrics import LLMMetrics, STTMetrics, TTSMetrics

from livekit.plugins import assemblyai, deepgram, elevenlabs, google, resemble, silero
from usage_logger import log_stt_usage, log_llm_usage, log_tts_usage

load_dotenv()

# Configure logging with timestamps for pipeline diagnostics
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("voice-agent")

# Backend API URL — auto-append /api if not present (for Render fromService URLs)
_raw_backend_url = os.environ.get("BACKEND_API_URL", "http://localhost:8000/api")
BACKEND_API_URL = _raw_backend_url if _raw_backend_url.endswith("/api") else f"{_raw_backend_url.rstrip('/')}/api"

# Per-event-loop HTTP client cache. With THREAD executor, each job may run on
# a different event loop. httpx.AsyncClient binds to the loop it's created on,
# so we cache one client per loop to avoid "bound to a different event loop" errors
# while still reusing connections within the same loop.
_http_clients: dict[int, httpx.AsyncClient] = {}


def _get_http_client() -> httpx.AsyncClient:
    """Return an httpx client for the current event loop."""
    loop = asyncio.get_event_loop()
    loop_id = id(loop)
    client = _http_clients.get(loop_id)
    if client is None or client.is_closed:
        client = httpx.AsyncClient(timeout=15)
        _http_clients[loop_id] = client
    return client


def fetch_and_inject_keys_sync(user_id: str = None, quiet: bool = False):
    """Fetch API keys from backend (synchronous). Only safe at module level / startup.

    Do NOT call this inside the async entrypoint — use fetch_and_inject_keys() instead.
    Set quiet=True to suppress routine log messages (used by background watcher).
    """
    import httpx as _httpx
    try:
        url = f"{BACKEND_API_URL}/settings/keys/agent"
        if user_id:
            url += f"?user_id={user_id}"
        resp = _httpx.get(url, timeout=5)
        if resp.status_code == 200:
            _apply_keys(resp.json(), quiet=quiet)
        else:
            logger.warning(f"Failed to fetch keys from backend: {resp.status_code}")
    except Exception as e:
        if not quiet:
            logger.warning(f"Could not fetch keys from backend (will use .env): {e}")


async def fetch_and_inject_keys(user_id: str = None, quiet: bool = False):
    """Fetch API keys from backend (async). Safe to call inside the entrypoint."""
    try:
        url = f"{BACKEND_API_URL}/settings/keys/agent"
        if user_id:
            url += f"?user_id={user_id}"
        client = _get_http_client()
        resp = await client.get(url)
        if resp.status_code == 200:
            _apply_keys(resp.json(), quiet=quiet)
        else:
            logger.warning(f"Failed to fetch keys from backend: {resp.status_code}")
    except Exception as e:
        if not quiet:
            logger.warning(f"Could not fetch keys from backend (will use .env): {e}")


def _apply_keys(keys: dict, quiet: bool = False):
    """Inject API keys into os.environ."""
    injected = []
    for key_name, value in keys.items():
        env_name = key_name.upper()
        if value:
            os.environ[env_name] = value
            injected.append(env_name)
    if injected and not quiet:
        logger.info(f"Injected {len(injected)} keys from backend dashboard: {', '.join(injected)}")
    elif not injected and not quiet:
        logger.info("No keys returned from backend dashboard")


# Fetch keys from backend dashboard at startup (sync is OK here — not in event loop yet).
# Retry in a loop until LIVEKIT_URL is available — in production the backend may return
# no keys until an org configures them, which would crash the worker immediately.
_KEY_FETCH_INTERVAL = 30  # seconds between retries
_KEY_FETCH_MAX_WAIT = 600  # give up after 10 minutes

fetch_and_inject_keys_sync()
_boot_wait_start = time.time()
while not os.environ.get("LIVEKIT_URL") and (time.time() - _boot_wait_start) < _KEY_FETCH_MAX_WAIT:
    logger.warning(
        f"[BOOT] LIVEKIT_URL not set — no keys from backend and no .env fallback. "
        f"Retrying in {_KEY_FETCH_INTERVAL}s..."
    )
    time.sleep(_KEY_FETCH_INTERVAL)
    fetch_and_inject_keys_sync(quiet=True)

if not os.environ.get("LIVEKIT_URL"):
    logger.error("[BOOT] LIVEKIT_URL still empty after max wait — exiting so container restarts")
    sys.exit(1)

# Store LiveKit keys at boot — used to detect changes later
_BOOT_LIVEKIT_KEYS = {
    "url": os.environ.get("LIVEKIT_URL", ""),
    "key": os.environ.get("LIVEKIT_API_KEY", ""),
    "secret": os.environ.get("LIVEKIT_API_SECRET", ""),
}
logger.info(f"[BOOT] LIVEKIT_URL: {_BOOT_LIVEKIT_KEYS['url']}")


def _watch_livekit_keys(interval: int = 60):
    """Background thread: periodically re-fetch keys from dashboard.
    If LiveKit keys changed since boot, exit so the container restarts with new keys.
    Runs every `interval` seconds. Skips in local dev.
    """
    if "localhost" in BACKEND_API_URL or "127.0.0.1" in BACKEND_API_URL:
        return  # Local dev — no need to watch

    logger.info(f"[WATCH] LiveKit key watcher started (checking every {interval}s)")
    while True:
        time.sleep(interval)
        try:
            fetch_and_inject_keys_sync(quiet=True)
            current = {
                "url": os.environ.get("LIVEKIT_URL", ""),
                "key": os.environ.get("LIVEKIT_API_KEY", ""),
                "secret": os.environ.get("LIVEKIT_API_SECRET", ""),
            }
            if current != _BOOT_LIVEKIT_KEYS:
                logger.warning(
                    f"[WATCH] LiveKit keys changed! "
                    f"Boot URL: {_BOOT_LIVEKIT_KEYS['url']} → Now: {current['url']}. "
                    f"Restarting agent..."
                )
                os._exit(1)
        except Exception as e:
            logger.debug(f"[WATCH] Key check failed: {e}")

# Default system prompt — only used if agent config has no system_prompt
DEFAULT_INSTRUCTIONS = """You are a voice assistant. The service is currently not available. Politely inform the caller that the service is temporarily unavailable and suggest they try again later. Do not engage in conversation beyond this. Never invent a company name or claim to represent a business."""


async def fetch_agent_config(agent_id: str) -> dict | None:
    """Fetch agent configuration from the backend API."""
    try:
        client = _get_http_client()
        response = await client.get(f"{BACKEND_API_URL}/agents/{agent_id}")
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"Failed to fetch agent config: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error fetching agent config: {e}")
        return None


async def lookup_agent_by_phone(phone_number: str) -> dict | None:
    """Look up an agent by its assigned Twilio phone number."""
    try:
        client = _get_http_client()
        response = await client.get(
            f"{BACKEND_API_URL}/telephony/lookup",
            params={"phone_number": phone_number},
        )
        if response.status_code == 200:
            return response.json()
        else:
            logger.warning(f"No agent found for phone {phone_number}: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"Error looking up agent by phone: {e}")
        return None


# --- Retry Helpers ---
MAX_RESOLVE_RETRIES = 3
RESOLVE_RETRY_DELAY = 1.5  # seconds


async def resolve_agent_id_from_metadata(ctx) -> tuple[str | None, dict]:
    """Try to extract agentId from room metadata, with retries for cloud latency."""
    for attempt in range(MAX_RESOLVE_RETRIES):
        room_metadata = ctx.room.metadata
        if room_metadata:
            try:
                metadata = json.loads(room_metadata)
                agent_id = metadata.get("agentId")
                if agent_id and agent_id != "default":
                    logger.info(f"Resolved agent ID from room metadata: {agent_id} (attempt {attempt + 1})")
                    return agent_id, metadata
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse room metadata (attempt {attempt + 1}): {e}")
        if attempt < MAX_RESOLVE_RETRIES - 1:
            logger.info(f"Room metadata empty or no agentId, retrying in {RESOLVE_RETRY_DELAY}s (attempt {attempt + 1}/{MAX_RESOLVE_RETRIES})")
            await asyncio.sleep(RESOLVE_RETRY_DELAY)
    return None, {}


async def resolve_agent_id_from_sip(ctx) -> str | None:
    """Try to resolve agent ID via SIP phone number lookup, with retries."""
    for attempt in range(MAX_RESOLVE_RETRIES):
        sip_number = get_sip_phone_number(ctx.room)
        if sip_number:
            logger.info(f"SIP call detected to number: {sip_number} (attempt {attempt + 1})")
            lookup = await lookup_agent_by_phone(sip_number)
            if lookup:
                agent_id = lookup.get("agent_id")
                logger.info(f"Resolved SIP call to agent: {agent_id} ({lookup.get('name')})")
                return agent_id
            else:
                logger.warning(f"No agent for SIP number {sip_number} (attempt {attempt + 1})")
        else:
            logger.info(f"No SIP participant attributes yet (attempt {attempt + 1}/{MAX_RESOLVE_RETRIES})")
        if attempt < MAX_RESOLVE_RETRIES - 1:
            await asyncio.sleep(RESOLVE_RETRY_DELAY)
    return None


def get_sip_phone_number(room) -> str | None:
    """Extract the called phone number from a SIP participant in the room."""
    for participant in room.remote_participants.values():
        attrs = participant.attributes or {}
        # LiveKit SIP sets sip.trunkPhoneNumber to the number that was called
        trunk_number = attrs.get("sip.trunkPhoneNumber")
        if trunk_number:
            logger.info(f"SIP participant detected — trunk phone number: {trunk_number}")
            return trunk_number
    return None


async def create_backend_session(room_name: str, user_id: str, agent_id: str | None) -> str | None:
    """Create a VoiceSession in the backend. Returns session ID."""
    try:
        client = _get_http_client()
        response = await client.post(
            f"{BACKEND_API_URL}/sessions/",
            json={
                "room_name": room_name,
                "user_id": user_id,
                "agent_id": agent_id,
                "session_data": {},
            },
        )
        if response.status_code == 201:
            data = response.json()
            logger.info(f"Created backend session: {data.get('id')}")
            return data.get("id")
        else:
            logger.warning(f"Failed to create session: {response.status_code} {response.text}")
    except Exception as e:
        logger.error(f"Error creating backend session: {e}")
    return None


async def save_transcript_to_backend(room_name: str, content: str, speaker: str):
    """Save a transcript line to the backend via the by-room endpoint."""
    if not content or not content.strip():
        return
    try:
        client = _get_http_client()
        await client.post(
            f"{BACKEND_API_URL}/sessions/by-room/{room_name}/transcripts",
            json={"content": content, "speaker": speaker.upper()},
        )
    except Exception as e:
        logger.error(f"Error saving transcript: {e}")


async def end_backend_session(room_name: str):
    """End the session in the backend to calculate duration."""
    try:
        client = _get_http_client()
        await client.post(f"{BACKEND_API_URL}/sessions/by-room/{room_name}/end")
        logger.info(f"Ended backend session for room {room_name}")
    except Exception as e:
        logger.error(f"Error ending backend session: {e}")


def create_transfer_call_tool(room_name: str, session_id_holder: dict) -> object:
    """Create the built-in transfer_call function tool.

    This tool is auto-injected into every agent — it's not stored in config.
    It handles both cold (immediate disconnect) and warm (stay for intro) transfers.
    """

    raw_schema = {
        "type": "function",
        "name": "transfer_call",
        "description": (
            "Transfer the current call to another phone number. "
            "Use type 'cold' for an immediate handoff (you disconnect right away). "
            "Use type 'warm' for a warm transfer (you stay on to introduce the caller, "
            "then disconnect)."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "phone_number": {
                    "type": "string",
                    "description": "The phone number to transfer the call to (E.164 format preferred)",
                },
                "type": {
                    "type": "string",
                    "enum": ["warm", "cold"],
                    "description": "Transfer type: 'cold' = immediate handoff, 'warm' = agent stays for intro",
                },
            },
            "required": ["phone_number", "type"],
        },
    }

    async def handler(raw_arguments: dict[str, object], context: RunContext):
        phone_number = str(raw_arguments.get("phone_number", ""))
        transfer_type = str(raw_arguments.get("type", "cold"))
        session_id = session_id_holder.get("id")

        logger.info(f"transfer_call invoked: phone={phone_number}, type={transfer_type}, session={session_id}")

        # Announce the transfer to the caller
        session = context.session
        if transfer_type == "warm":
            announce_msg = f"Let me transfer you to {phone_number}. I'll stay on the line to introduce you."
        else:
            announce_msg = f"Let me transfer you to {phone_number}. One moment please."

        if session:
            await session.say(announce_msg)

        # Log to transcript
        asyncio.create_task(
            save_transcript_to_backend(room_name, f"[Transfer: {transfer_type} → {phone_number}]", "AGENT")
        )

        # Call backend to initiate transfer
        if not session_id:
            logger.error("No session ID available for transfer")
            if session:
                await session.say("I'm sorry, I wasn't able to complete the transfer. Let me continue helping you.")
            return "Error: No active session to transfer"

        try:
            client = _get_http_client()
            response = await client.post(
                f"{BACKEND_API_URL}/sessions/{session_id}/transfer",
                json={"phone_number": phone_number, "type": transfer_type.upper()},
                timeout=10,
            )
            response.raise_for_status()
            result = response.json()
        except Exception as e:
            logger.error(f"Transfer API call failed: {e}")
            if session:
                await session.say("I'm sorry, the transfer didn't go through. Let me continue helping you.")
            asyncio.create_task(
                save_transcript_to_backend(room_name, f"[Transfer failed: {e}]", "AGENT")
            )
            return f"Transfer failed: {str(e)}"

        logger.info(f"Transfer initiated: {result}")

        # Handle cold vs warm disconnect
        if transfer_type == "cold":
            # Cold transfer: agent disconnects after handoff
            if session:
                await session.say("Your call is being transferred now. Goodbye!")
            asyncio.create_task(
                save_transcript_to_backend(room_name, "[Agent disconnected after cold transfer]", "AGENT")
            )
            # Give TTS time to finish speaking before disconnecting
            await asyncio.sleep(3)
            await end_backend_session(room_name)
            if context.session:
                context.session.close()
        else:
            # Warm transfer: agent stays for intro, then drops
            # Return result so LLM can facilitate the introduction
            asyncio.create_task(
                save_transcript_to_backend(room_name, "[Warm transfer initiated — agent staying for intro]", "AGENT")
            )

        return f"Transfer {transfer_type} to {phone_number} initiated successfully. Status: {result.get('status', 'unknown')}"

    return function_tool(handler, raw_schema=raw_schema)


def create_function_tools(functions_config: list[dict], room_name: str) -> list:
    """Build dynamic LiveKit function tools from agent config.functions array.

    Each function config defines a name, description, JSON Schema parameters,
    and an HTTP endpoint to call when the LLM invokes the tool.
    """
    tools = []
    for func_config in functions_config:
        name = func_config.get("name")
        description = func_config.get("description", "")
        parameters = func_config.get("parameters", {"type": "object", "properties": {}})
        endpoint = func_config.get("endpoint", {})
        speak_during_execution = func_config.get("speak_during_execution", False)
        speak_on_send = func_config.get("speak_on_send", "")

        if not name:
            logger.warning("Skipping function with no name")
            continue

        raw_schema = {
            "type": "function",
            "name": name,
            "description": description,
            "parameters": parameters,
        }

        # Capture config in closure defaults to avoid late-binding issues
        def _make_handler(
            _endpoint=endpoint,
            _name=name,
            _speak_during_execution=speak_during_execution,
            _speak_on_send=speak_on_send,
            _room_name=room_name,
        ):
            async def handler(raw_arguments: dict[str, object], context: RunContext):
                logger.info(f"Function call: {_name}({json.dumps(raw_arguments)})")

                # Say filler phrase while executing if configured
                if _speak_during_execution and _speak_on_send:
                    session = context.session
                    if session:
                        await session.say(_speak_on_send)

                # Make HTTP request to the configured endpoint
                url = _endpoint.get("url", "")
                method = _endpoint.get("method", "POST").upper()
                header_list = _endpoint.get("headers", [])
                timeout = _endpoint.get("timeout", 10)

                header_dict = {}
                for h in header_list:
                    key = h.get("key", "")
                    value = h.get("value", "")
                    if key:
                        header_dict[key] = value

                result_text = ""
                try:
                    client = _get_http_client()
                    if method in ("POST", "PUT", "PATCH"):
                        response = await client.request(
                            method=method,
                            url=url,
                            json=raw_arguments,
                            headers=header_dict,
                            timeout=timeout,
                        )
                    else:  # GET, DELETE — send args as query params
                        response = await client.request(
                            method=method,
                            url=url,
                            params={k: str(v) for k, v in raw_arguments.items()},
                            headers=header_dict,
                            timeout=timeout,
                        )

                    response.raise_for_status()

                    content_type = response.headers.get("content-type", "")
                    if "application/json" in content_type:
                        result_data = response.json()
                        result_text = json.dumps(result_data)
                    else:
                            result_text = response.text

                except httpx.TimeoutException:
                    result_text = f"Error: Request to {_name} timed out after {timeout}s"
                    logger.error(f"Function {_name} timed out: {url}")
                except httpx.HTTPStatusError as e:
                    result_text = f"Error: {_name} returned HTTP {e.response.status_code}"
                    logger.error(f"Function {_name} HTTP error: {e}")
                except Exception as e:
                    result_text = f"Error: {_name} failed — {str(e)}"
                    logger.error(f"Function {_name} error: {e}")

                # Log function call to transcript
                args_str = json.dumps(raw_arguments)
                log_content = f"[Function: {_name}({args_str})] → {result_text}"
                asyncio.create_task(
                    save_transcript_to_backend(_room_name, log_content, "AGENT")
                )

                return result_text

            return handler

        tool = function_tool(_make_handler(), raw_schema=raw_schema)
        tools.append(tool)
        logger.info(f"Registered function tool: {name}")

    return tools


class VoiceAssistant(Agent):
    """Custom voice assistant agent."""

    def __init__(self, instructions: str = DEFAULT_INSTRUCTIONS, tools=None) -> None:
        super().__init__(
            instructions=instructions,
            tools=tools or [],
        )


# Detect dev vs production mode from sys.argv (before AgentServer is created).
# Dev mode: use THREAD executor (Windows-compatible, simpler, works with hot reload).
# Production (start): use PROCESS executor with idle processes for true isolation.
_is_dev_mode = "dev" in sys.argv

if _is_dev_mode:
    # THREAD executor: jobs run as async tasks in the main process.
    # room.disconnect() at end of each call ensures fast cleanup.
    server = AgentServer(
        job_executor_type=agents.JobExecutorType.THREAD,
        shutdown_process_timeout=5.0,
    )
    logger.info("[INIT] Dev mode — using THREAD executor (single process, async concurrency)")
else:
    # PROCESS executor: each call runs in its own subprocess.
    # Pre-warmed idle processes for instant call pickup.
    server = AgentServer(
        job_executor_type=agents.JobExecutorType.PROCESS,
        num_idle_processes=3,
        initialize_process_timeout=30.0,
        shutdown_process_timeout=5.0,
    )
    logger.info("[INIT] Production mode — using PROCESS executor (3 idle processes)")


@server.rtc_session(agent_name="arkenos-agent")
async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint for the voice agent session."""

    call_start_time = time.time()
    logger.info(f"[CALL] ========== NEW CALL ==========")
    logger.info(f"[CALL] Room: {ctx.room.name}")

    # Wait for room to be fully connected
    logger.info("[CALL] Connecting to room...")
    try:
        await ctx.connect()
        logger.info(f"[CALL] Room connected in {time.time() - call_start_time:.2f}s, waiting for participant...")
    except Exception as e:
        logger.error(f"[CALL] FAILED to connect to room: {e}", exc_info=True)
        raise

    # Track whether a phone participant has disconnected (used for early cleanup)
    _phone_disconnected = asyncio.Event()

    @ctx.room.on("participant_disconnected")
    def on_early_disconnect(participant):
        if (participant.identity.startswith("sip_") or
            participant.identity.startswith("phone-") or
            participant.identity.startswith("+")):
            logger.info(f"Phone participant left early: {participant.identity}")
            _phone_disconnected.set()

    # Wait for participant with a timeout so we don't hang forever if caller hangs up
    try:
        participant = await asyncio.wait_for(ctx.wait_for_participant(), timeout=30)
    except asyncio.TimeoutError:
        logger.warning("Timed out waiting for participant (30s) — ending session")
        await end_backend_session(ctx.room.name)
        return

    # Check if the phone participant already left during setup
    if _phone_disconnected.is_set():
        logger.info("Phone participant already disconnected — ending session")
        await end_backend_session(ctx.room.name)
        return

    logger.info(f"[CALL] Participant joined: identity={participant.identity}, name={getattr(participant, 'name', 'N/A')}")

    # Log all participant attributes for SIP debugging
    attrs = participant.attributes or {}
    if attrs:
        logger.info(f"[CALL] Participant attributes: {dict(attrs)}")

    # Log all remote participants in room
    for pid, p in ctx.room.remote_participants.items():
        p_attrs = p.attributes or {}
        logger.info(f"[CALL] Remote participant: identity={p.identity}, attrs={dict(p_attrs)}")

    # --- RESOLVE AGENT ID (with retries for cloud latency) ---
    agent_id = None
    agent_config = None
    voice_id = None
    system_prompt = None
    first_message = None
    first_message_mode = "assistant_speaks_first"
    metadata = {}

    # Quick check: if a SIP participant is already present, skip metadata retries
    # (metadata is only set for browser calls, so retrying it wastes ~4.5s on phone calls).
    # If no SIP participant yet, fall through to normal metadata-first flow.
    sip_number = get_sip_phone_number(ctx.room)
    if sip_number:
        logger.info(f"[CALL] SIP participant already present ({sip_number}) — skipping metadata, resolving via phone lookup")
        agent_id = await resolve_agent_id_from_sip(ctx)
    else:
        # Step 1: Try room metadata (browser calls set agentId here)
        agent_id, metadata = await resolve_agent_id_from_metadata(ctx)

    # Step 2: If still no agent, try SIP lookup (covers late-arriving SIP participants)
    if not agent_id:
        agent_id = await resolve_agent_id_from_sip(ctx)

    # Step 3: If agent_id STILL not resolved — disconnect gracefully, never fallback
    if not agent_id:
        logger.error(
            "[CALL] FATAL: Could not resolve agent_id after all retries. "
            "Room: %s. Disconnecting call — refusing to use fallback.",
            ctx.room.name,
        )
        await end_backend_session(ctx.room.name)
        return

    # Fetch agent config — required, not optional
    agent_config = await fetch_agent_config(agent_id)
    if not agent_config:
        logger.error(
            "[CALL] FATAL: agent_id=%s resolved but config fetch failed. "
            "Room: %s. Disconnecting call.",
            agent_id, ctx.room.name,
        )
        await end_backend_session(ctx.room.name)
        return

    logger.info(f"Full agent config: {agent_config}")

    # Re-fetch keys scoped to the agent owner so each user's keys are used
    owner_user_id = agent_config.get("user_id")
    if owner_user_id:
        await fetch_and_inject_keys(user_id=owner_user_id)

    config = agent_config.get("config", {})
    system_prompt = config.get("system_prompt")
    if not system_prompt:
        logger.warning(f"[CALL] Agent {agent_id} has no system_prompt in config — using generic default")
        system_prompt = DEFAULT_INSTRUCTIONS
    first_message = config.get("first_message") or "Sorry, this service is currently not available. Please try calling back later. Goodbye."
    voice_id = config.get("voice_id")
    first_message_mode = config.get("first_message_mode", "assistant_speaks_first")

    # Replace {{agent_name}} placeholder with the actual agent name
    agent_name = agent_config.get("name", "")
    if agent_name:
        system_prompt = system_prompt.replace("{{agent_name}}", agent_name)
        first_message = first_message.replace("{{agent_name}}", agent_name)
            
    # Get STT provider from config (default to assemblyai)
    stt_provider = config.get("stt_provider", "assemblyai")

    # Create STT based on provider selection
    logger.info(f"[PIPELINE] Initializing STT provider: {stt_provider}")
    try:
        if stt_provider == "assemblyai":
            api_key = os.environ.get("ASSEMBLYAI_API_KEY")
            logger.info(f"[PIPELINE] AssemblyAI API key present: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
            stt = assemblyai.STT()
        elif stt_provider == "elevenlabs":
            api_key = os.environ.get("ELEVENLABS_API_KEY")
            logger.info(f"[PIPELINE] ElevenLabs API key present: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
            stt = elevenlabs.STT()
        else:
            api_key = os.environ.get("DEEPGRAM_API_KEY")
            logger.info(f"[PIPELINE] Deepgram API key present: {bool(api_key)}, length: {len(api_key) if api_key else 0}")
            stt = deepgram.STT()
        logger.info(f"[PIPELINE] STT initialized successfully: {stt_provider}")
    except Exception as e:
        logger.error(f"[PIPELINE] FAILED to initialize STT ({stt_provider}): {e}", exc_info=True)
        raise
    
    # --- WEBHOOKS SUPPORT ---
    if agent_config:
        # --- WEBHOOKS ---
        webhooks = config.get("webhooks", {})
        
        # Pre-call Webhook
        pre_call = webhooks.get("pre_call", {})
        if pre_call.get("enabled"):
            logger.info("Executing pre-call webhook...")
            try:
                payload = {
                    "agent_id": agent_id,
                    "room_name": ctx.room.name,
                    "user_id": metadata.get("userId"), # From room metadata
                    "event": "pre_call"
                }
                
                response_data = await execute_webhook(
                    url=pre_call.get("url"),
                    method=pre_call.get("method", "GET"),
                    headers=pre_call.get("headers", []),
                    body=payload if pre_call.get("method") == "POST" else None,
                    timeout=pre_call.get("timeout", 5)
                )
                
                # Handle Assignments
                if response_data and pre_call.get("assignments"):
                    variables = {}
                    for assignment in pre_call.get("assignments", []):
                        # Simple path traversal (e.g. key.subkey)
                        value = response_data
                        for key in assignment["path"].split("."):
                            if isinstance(value, dict):
                                value = value.get(key)
                            else:
                                value = None
                                break
                        if value is not None:
                            variables[assignment["variable"]] = str(value)
                    
                    logger.info(f"Webhook assignments: {variables}")
                    
                    # Apply variables to prompts
                    if variables:
                        try:
                            # Use safe substitution that ignores missing keys
                            for key, val in variables.items():
                                placeholder = "{{" + key + "}}"
                                system_prompt = system_prompt.replace(placeholder, val)
                                first_message = first_message.replace(placeholder, val)
                        except Exception as e:
                            logger.error(f"Error applying webhook variables: {e}")

            except Exception as e:
                logger.error(f"Pre-call webhook failed: {e}")

    # Create TTS with the configured voice (official LiveKit Resemble plugin)
    logger.info(f"[PIPELINE] Initializing TTS (Resemble AI official plugin), voice_id={voice_id}")
    try:
        resemble_key = os.environ.get("RESEMBLE_API_KEY")
        resemble_voice = voice_id or os.environ.get("RESEMBLE_VOICE_UUID")
        logger.info(f"[PIPELINE] Resemble API key present: {bool(resemble_key)}, voice_uuid: {resemble_voice}")
        tts = resemble.TTS(
            voice_uuid=resemble_voice,
            model="chatterbox-turbo",
            use_streaming=True,
        )
        logger.info("[PIPELINE] TTS initialized: model=chatterbox-turbo, streaming=True")
    except Exception as e:
        logger.error(f"[PIPELINE] FAILED to initialize TTS (Resemble): {e}", exc_info=True)
        raise
    
    # --- CREATE BACKEND SESSION ---
    # For SIP calls, use the agent owner's user_id so sessions appear in their call log.
    # For browser calls, use the userId from room metadata.
    # agent_config["user_id"] is the agent owner's internal DB user UUID.
    if metadata.get("userId"):
        session_user_id = metadata["userId"]
    elif agent_config and agent_config.get("user_id"):
        session_user_id = agent_config["user_id"]  # Agent owner's DB UUID for SIP calls
    else:
        session_user_id = "sip-caller"  # Last-resort fallback
    session_id_holder = {"id": None}
    session_id = await create_backend_session(
        room_name=ctx.room.name,
        user_id=session_user_id,
        agent_id=agent_id,
    )
    session_id_holder["id"] = session_id
    
    # Create the agent session with STT, LLM, and TTS
    logger.info("[PIPELINE] Initializing LLM (Google Gemini)")
    try:
        google_key = os.environ.get("GOOGLE_API_KEY")
        logger.info(f"[PIPELINE] Google API key present: {bool(google_key)}, length: {len(google_key) if google_key else 0}")
        llm = google.LLM()
        logger.info("[PIPELINE] LLM initialized successfully")
    except Exception as e:
        logger.error(f"[PIPELINE] FAILED to initialize LLM (Google Gemini): {e}", exc_info=True)
        raise

    logger.info("[PIPELINE] Loading Silero VAD")
    try:
        vad = silero.VAD.load()
        logger.info("[PIPELINE] VAD loaded successfully")
    except Exception as e:
        logger.error(f"[PIPELINE] FAILED to load VAD (Silero): {e}", exc_info=True)
        raise

    logger.info("[PIPELINE] Creating AgentSession (STT + LLM + TTS + VAD)")
    session = AgentSession(
        stt=stt,
        llm=llm,
        tts=tts,
        vad=vad,
    )
    logger.info("[PIPELINE] AgentSession created successfully")
    logger.info(f"[PIPELINE] ===== Pipeline Summary =====")
    logger.info(f"[PIPELINE]   STT: {stt_provider}")
    logger.info(f"[PIPELINE]   LLM: google-gemini")
    logger.info(f"[PIPELINE]   TTS: resemble-ai (voice={voice_id or 'default'})")
    logger.info(f"[PIPELINE]   VAD: silero")
    logger.info(f"[PIPELINE]   Agent ID: {agent_id}")
    logger.info(f"[PIPELINE]   Room: {ctx.room.name}")
    logger.info(f"[PIPELINE] =============================")

    # --- ERROR HOOKS ---
    # Catch runtime pipeline errors (STT/LLM/TTS failures during the call)
    @session.on("error")
    def on_session_error(error):
        logger.error(f"[PIPELINE ERROR] AgentSession error: {error}", exc_info=isinstance(error, Exception))

    @session.on("close")
    def on_session_close():
        logger.info("[PIPELINE] AgentSession closed")

    # --- TRANSCRIPT HOOKS ---
    # Save user speech transcripts (only final results, not intermediate streaming partials)
    @session.on("user_input_transcribed")
    def on_user_transcript(transcript):
        is_final = getattr(transcript, "is_final", True)
        if not is_final:
            return
        text = getattr(transcript, "transcript", None) or getattr(transcript, "text", None)
        if not text:
            text = transcript.get("transcript", transcript.get("text", "")) if isinstance(transcript, dict) else ""
        if text and text.strip():
            logger.info(f"[STT] User said: {text.strip()[:100]}")
            asyncio.create_task(save_transcript_to_backend(ctx.room.name, text.strip(), "USER"))
    
    # Save agent speech transcripts via conversation_item_added (role='assistant')
    @session.on("conversation_item_added")
    def on_conversation_item(event):
        item = getattr(event, "item", None)
        if item is None:
            return
        role = getattr(item, "role", None)
        if role != "assistant":
            return  # Only capture agent turns here; user turns come from user_input_transcribed
        # Extract text content from ChatMessage
        content = getattr(item, "content", None)
        if isinstance(content, list):
            # content is a list of content parts; extract text parts
            text_parts = []
            for part in content:
                if isinstance(part, str):
                    text_parts.append(part)
                elif hasattr(part, "text"):
                    text_parts.append(part.text)
            text = " ".join(text_parts).strip()
        elif isinstance(content, str):
            text = content.strip()
        else:
            text = str(content).strip() if content else ""
        if text:
            logger.info(f"[LLM] Agent said: {text[:100]}")
            asyncio.create_task(save_transcript_to_backend(ctx.room.name, text, "AGENT"))
    
    # --- USAGE METRICS HOOK ---
    # Log STT / LLM / TTS usage events for cost tracking
    @session.on("metrics_collected")
    def on_metrics(metrics):
        if isinstance(metrics, STTMetrics):
            logger.info(f"[METRICS] STT ({stt_provider}): audio_duration={getattr(metrics, 'audio_duration', 'N/A')}s")
        elif isinstance(metrics, LLMMetrics):
            logger.info(f"[METRICS] LLM (google): prompt_tokens={metrics.prompt_tokens}, completion_tokens={metrics.completion_tokens}")
        elif isinstance(metrics, TTSMetrics):
            logger.info(f"[METRICS] TTS (resemble): characters={metrics.characters_count}")

        if not session_id:
            logger.warning("[METRICS] No session_id, skipping usage log")
            return
        if isinstance(metrics, STTMetrics):
            log_stt_usage(
                backend_url=BACKEND_API_URL,
                session_id=session_id,
                user_id=session_user_id,
                agent_id=agent_id,
                provider=stt_provider,
                audio_duration=metrics.audio_duration,
            )
        elif isinstance(metrics, LLMMetrics):
            log_llm_usage(
                backend_url=BACKEND_API_URL,
                session_id=session_id,
                user_id=session_user_id,
                agent_id=agent_id,
                provider="google",
                input_tokens=metrics.prompt_tokens,
                output_tokens=metrics.completion_tokens,
            )
        elif isinstance(metrics, TTSMetrics):
            log_tts_usage(
                backend_url=BACKEND_API_URL,
                session_id=session_id,
                user_id=session_user_id,
                agent_id=agent_id,
                provider="resemble",
                character_count=metrics.characters_count,
            )

    # --- FUNCTION TOOLS ---
    # Build dynamic tools from agent config.functions array
    function_tools = []
    if agent_config:
        functions_config = agent_config.get("config", {}).get("functions", [])
        logger.info(f"Functions from config: {functions_config}")
        if functions_config:
            function_tools = create_function_tools(functions_config, ctx.room.name)
            logger.info(f"Registered {len(function_tools)} config function tool(s)")

    # Always inject built-in transfer_call tool (available to every agent)
    transfer_tool = create_transfer_call_tool(ctx.room.name, session_id_holder)
    function_tools.append(transfer_tool)
    logger.info(f"Registered built-in transfer_call tool (total tools: {len(function_tools)})")

    # Start the session with the configured system prompt and tools
    logger.info(f"[PIPELINE] Starting session with system_prompt ({len(system_prompt)} chars), first_message_mode={first_message_mode}, tools={len(function_tools)}")
    try:
        t0 = time.time()
        await session.start(
            room=ctx.room,
            agent=VoiceAssistant(instructions=system_prompt, tools=function_tools),
        )
        logger.info(f"[PIPELINE] Session started successfully in {time.time() - t0:.2f}s")
    except Exception as e:
        logger.error(f"[PIPELINE] FAILED to start session: {e}", exc_info=True)
        raise

    # Speak initial greeting only if mode is assistant_speaks_first
    if first_message_mode == "assistant_speaks_first":
        logger.info(f"[PIPELINE] Speaking greeting (direct TTS, skipping LLM): {first_message[:80]}...")
        try:
            t0 = time.time()
            await session.say(first_message)
            logger.info(f"[PIPELINE] First message spoken in {time.time() - t0:.2f}s")
        except Exception as e:
            logger.error(f"[PIPELINE] FAILED to speak first message: {e}", exc_info=True)
    else:
        logger.info("[PIPELINE] Assistant waiting for user to speak first")

    # --- PARTICIPANT DISCONNECT HANDLER (session phase) ---
    # Now that the session is running, close it when the phone participant leaves.
    @ctx.room.on("participant_disconnected")
    def on_session_participant_disconnected(participant):
        if (participant.identity.startswith("sip_") or
            participant.identity.startswith("phone-") or
            participant.identity.startswith("+")):
            logger.info(f"Phone participant left: {participant.identity} — closing session")
            _phone_disconnected.set()
            asyncio.create_task(_cleanup_session())

    async def _cleanup_session():
        try:
            await session.aclose()
        except Exception:
            pass

    # Wait for the call to end (phone participant disconnects or room closes)
    logger.info("[CALL] Voice pipeline running, waiting for call to end...")
    await _phone_disconnected.wait()
    logger.info("[CALL] Phone participant disconnected, cleaning up...")

    # Brief grace period to let final TTS finish playing
    await asyncio.sleep(1)

    # --- CLEANUP ---
    logger.info("[CALL] Shutting down, closing session...")
    try:
        await session.aclose()
    except Exception as e:
        logger.warning(f"[CALL] session.aclose() error: {e}")

    # --- END BACKEND SESSION ---
    await end_backend_session(ctx.room.name)
    call_duration = time.time() - call_start_time
    logger.info(f"[CALL] ========== CALL ENDED ==========")
    logger.info(f"[CALL] Room: {ctx.room.name}, total duration: {call_duration:.1f}s")

    # --- POST-CALL WEBHOOK EXECUTION ---
    # Must run BEFORE room.disconnect() — once disconnected the job exits immediately.
    if agent_config:
         webhooks = agent_config.get("config", {}).get("webhooks", {})
         post_call = webhooks.get("post_call", {})

         if post_call.get("enabled"):
            logger.info("Executing post-call webhook...")
            try:
                # Context variables
                variables = {
                    "agent_id": agent_id,
                    "room_name": ctx.room.name,
                    "user_id": metadata.get("userId") if metadata else None,
                    "reason": "disconnected",
                }

                # Construct body
                body_template = post_call.get("body", "{}")
                body_str = body_template
                for key, val in variables.items():
                    placeholder = "{{" + key + "}}"
                    if body_str:
                        body_str = body_str.replace(placeholder, str(val))

                req_body = None
                try:
                    if body_str:
                        req_body = json.loads(body_str)
                    else:
                        req_body = variables
                except:
                    req_body = variables

                await execute_webhook(
                    url=post_call.get("url"),
                    method=post_call.get("method", "POST"),
                    headers=post_call.get("headers", []),
                    body=req_body,
                    timeout=post_call.get("timeout", 10)
                )
                logger.info("Post-call webhook executed successfully.")
            except Exception as e:
                logger.error(f"Post-call webhook failed: {e}")

    # Note: We intentionally do NOT call ctx.room.disconnect() here.
    # With THREAD executor, room.disconnect() triggers LiveKit's internal
    # http_session cleanup which corrupts the shared event loop state,
    # preventing subsequent calls from being dispatched. The room will
    # close automatically when the entrypoint returns (LiveKit SDK handles this).
    logger.info("[CALL] Entrypoint complete, room will close automatically")

async def execute_webhook(url: str, method: str, headers: list, body: dict | None, timeout: int) -> dict | None:
    """Execute a webhook request."""
    if not url:
        return None
        
    try:
        # Convert list of headers to dict
        header_dict = {h["key"]: h["value"] for h in headers if h["key"]}

        client = _get_http_client()
        response = await client.request(
            method=method,
            url=url,
            headers=header_dict,
            json=body,
            timeout=timeout,
        )
        response.raise_for_status()
        if response.headers.get("content-type") == "application/json":
            return response.json()
        return None
    except Exception as e:
        logger.error(f"Webhook request failed to {url}: {e}")
        raise e


def _handle_sigterm(signum, frame):
    """Handle SIGTERM for graceful shutdown on platforms like Render."""
    logger.info("SIGTERM received — shutting down gracefully...")
    sys.exit(0)


# --- LiveKit credential live-reload via WebSocket ---
# Connects to backend WebSocket. When LiveKit keys change in the dashboard,
# the backend pushes a notification and the agent restarts immediately.

_WS_RECONNECT_DELAY = 5  # seconds between reconnection attempts


async def _config_websocket():
    """Background task: maintain WebSocket to backend for config change notifications."""
    import websockets

    ws_url = BACKEND_API_URL.replace("http://", "ws://").replace("https://", "wss://")
    ws_url = f"{ws_url}/settings/ws/agent"

    while True:
        try:
            async with websockets.connect(ws_url) as ws:
                logger.info(f"[CONFIG-WS] Connected to backend ({ws_url})")
                async for message in ws:
                    try:
                        data = json.loads(message)
                        event_type = data.get("type")

                        if event_type == "livekit_keys_changed":
                            logger.warning(
                                "[CONFIG-WS] LiveKit credentials changed in dashboard!"
                            )
                            logger.warning("[CONFIG-WS] Re-launching agent with new credentials...")

                            # Re-exec immediately — replaces this process with a fresh one.
                            # Active calls will be dropped, but this is expected when
                            # switching LiveKit projects (all rooms are on the old project).
                            os.execv(sys.executable, [sys.executable] + sys.argv)

                    except json.JSONDecodeError:
                        if message == "pong":
                            continue
                        logger.debug(f"[CONFIG-WS] Non-JSON message: {message}")

        except Exception as e:
            logger.debug(f"[CONFIG-WS] Connection failed: {e}, reconnecting in {_WS_RECONNECT_DELAY}s...")
            await asyncio.sleep(_WS_RECONNECT_DELAY)


@server.on("worker_registered")
def _start_config_ws(*args):
    """Start the config WebSocket after successful registration."""
    asyncio.get_event_loop().create_task(_config_websocket())
    logger.info("[CONFIG-WS] Connecting to backend for live config reload")


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, _handle_sigterm)
    threading.Thread(target=_watch_livekit_keys, daemon=True).start()
    agents.cli.run_app(server)
