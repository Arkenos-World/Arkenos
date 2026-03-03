"""Default file templates for custom agent scaffolding."""

import uuid
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session

from app.models import Agent, AgentFile, AgentFileVersion, AgentMode
from app.services import minio_client

SCAFFOLD_FILES: dict[str, str] = {
    "agent.py": '''\
"""
Custom Arkenos Voice Agent

This is the main entry point for your custom agent.
Define your Agent class, tools, and the `server` + `entrypoint` at module level.
The Arkenos runtime imports this module and runs the `server`.
"""

import logging
import os

from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, RunContext, function_tool
from livekit.plugins import assemblyai, google, silero

from resemble_tts import ResembleTTS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("custom-agent")


# Load system prompt from file
def load_system_prompt() -> str:
    """Read system prompt from prompts/system.txt."""
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "system.txt")
    try:
        with open(prompt_path, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return "You are a helpful AI voice assistant. Be concise and friendly."


class VoiceAssistant(Agent):
    """Your custom voice assistant agent.

    Add tools, change instructions, or override hooks here.
    """

    def __init__(self, instructions: str | None = None, tools=None) -> None:
        super().__init__(
            instructions=instructions or load_system_prompt(),
            tools=tools or [],
        )


# --- Server and entrypoint MUST be at module level ---

server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    """Main entrypoint — called when a user connects."""

    logger.info(f"Session started in room: {ctx.room.name}")
    await ctx.connect()

    # Wait for a human participant to join the room
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Build the pipeline: STT + LLM + TTS + VAD
    session = AgentSession(
        stt=assemblyai.STT(),
        llm=google.LLM(),
        tts=ResembleTTS(),
        vad=silero.VAD.load(),
    )

    # Start the agent
    await session.start(
        room=ctx.room,
        agent=VoiceAssistant(),
    )

    # Greet the user
    await session.generate_reply(
        instructions="Greet the user warmly and ask how you can help."
    )
''',
    "arkenos.yaml": """\
# Arkenos agent configuration
# This file describes your agent's metadata and pipeline settings.
name: my-custom-agent
version: "0.1.0"
runtime: python3.11

# Pipeline providers (these are pre-installed in the base image)
stt:
  provider: assemblyai    # Options: assemblyai, deepgram

llm:
  provider: gemini        # Options: gemini

tts:
  provider: resemble      # Options: resemble, elevenlabs

settings:
  max_idle_timeout: 300
  enable_webhooks: false
""",
    "requirements.txt": """\
# Add your custom Python dependencies here.
# The base Arkenos runtime already includes:
#   - livekit-agents + all plugins (assemblyai, deepgram, google, silero, elevenlabs)
#   - httpx, aiohttp, pydantic, numpy
#   - resemble_tts (custom TTS plugin)
#   - usage_logger (cost tracking)
#
# Only add packages NOT in the base image. Example:
# beautifulsoup4==4.12.0
# langchain-core>=0.2.0
""",
    "tools/__init__.py": """\
# Custom tools that your agent can invoke during a conversation.
#
# Example tool:
#
#     from livekit.agents import function_tool, RunContext
#
#     @function_tool
#     async def get_weather(city: str, context: RunContext) -> str:
#         \"\"\"Get the current weather for a city.\"\"\"
#         return f"It's sunny in {city}!"
#
# Then add it to your agent:
#
#     class VoiceAssistant(Agent):
#         def __init__(self):
#             super().__init__(
#                 instructions=load_system_prompt(),
#                 tools=[get_weather],
#             )
""",
    "webhooks/__init__.py": """\
# Webhook handlers for external integrations.
#
# Use webhooks to call external APIs during or after a conversation.
# Import and use httpx for async HTTP calls.
#
# Example:
#
#     import httpx
#
#     async def notify_crm(session_id: str, transcript: str):
#         async with httpx.AsyncClient() as client:
#             await client.post("https://api.example.com/webhook", json={
#                 "session_id": session_id,
#                 "transcript": transcript,
#             })
""",
    "prompts/system.txt": """\
You are a helpful AI voice assistant built with Arkenos.

## Your Role
- Answer questions clearly and concisely
- Be friendly and professional
- Keep responses short — this is a voice conversation, not a text chat

## Guidelines
- Speak in natural, conversational sentences
- Avoid bullet points and formatting — the user is listening, not reading
- If you don't know something, say so honestly
- Ask clarifying questions when the user's request is unclear
""",
    "pipelines/__init__.py": """\
# Custom pipeline stages for audio/text processing.
#
# You can create custom STT, TTS, or LLM wrappers here if you need
# to modify the default behavior of the pipeline components.
""",
    "utils/__init__.py": """\
# Shared utility functions for your agent.
#
# Put helper functions, constants, and shared logic here.
# Import them in agent.py with: from utils import my_function
""",
}


def scaffold_agent(agent_id: str, db: Session) -> list[AgentFile]:
    """Create all default scaffold files in MinIO and the database.

    Returns the list of created AgentFile records.
    """
    minio_client.ensure_bucket()
    created: list[AgentFile] = []

    for file_path, content in SCAFFOLD_FILES.items():
        content_bytes = content.encode("utf-8")
        content_hash = hashlib.sha256(content_bytes).hexdigest()
        size_bytes = len(content_bytes)

        # Upload current version to MinIO
        minio_client.upload_file(agent_id, file_path, content_bytes)

        # Upload as version 1
        minio_key = minio_client.upload_version(agent_id, file_path, 1, content_bytes)

        # Create DB record
        file_id = str(uuid.uuid4())
        agent_file = AgentFile(
            id=file_id,
            agent_id=agent_id,
            file_path=file_path,
            content_hash=content_hash,
            size_bytes=size_bytes,
            mime_type="text/plain",
            version=1,
        )
        db.add(agent_file)

        # Create version record
        version_record = AgentFileVersion(
            id=str(uuid.uuid4()),
            agent_file_id=file_id,
            version=1,
            content_hash=content_hash,
            minio_key=minio_key,
            size_bytes=size_bytes,
        )
        db.add(version_record)
        created.append(agent_file)

    db.commit()
    for f in created:
        db.refresh(f)
    return created
