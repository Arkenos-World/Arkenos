"""Coding AI assistant router for custom agents — Cursor-like streaming experience."""

import json
import re
import uuid
import logging
import hashlib
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Path
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.config_resolver import get_key, require_providers
from app.models import Agent, AgentFile, CodingAgentConversation, CodingAgentMessage
from app.schemas import (
    CodingAgentRequest,
    ConversationListItem,
    ConversationDetailResponse,
    MessageResponse,
)
from app.services import minio_client
from app.services.coding_agent_prompt import SYSTEM_PROMPT
from app.dependencies import verify_agent_ownership, get_current_user
from app.models import User, AgentEnvVar
from app.services.encryption import encrypt, decrypt

logger = logging.getLogger(__name__)
router = APIRouter()

CODING_MODEL = "gemini-3-flash-preview"


# ---- Function calling tool definitions for the AI assistant ----

ASSISTANT_FUNCTIONS = [
    {
        "name": "request_env_var",
        "description": "Request the user to securely enter an API key or secret for this agent. This shows a secure input form in the chat — the value never passes through the AI. Use this when code needs an API key (e.g., TAVILY_API_KEY, LINEAR_API_KEY). The user will enter the value directly.",
        "parameters": {
            "type": "object",
            "properties": {
                "key_name": {
                    "type": "string",
                    "description": "Environment variable name in UPPER_SNAKE_CASE (e.g., TAVILY_API_KEY)",
                },
                "description": {
                    "type": "string",
                    "description": "Short description shown to user (e.g., 'Tavily Search API key')",
                },
                "help_url": {
                    "type": "string",
                    "description": "URL where user can get the key (e.g., 'https://tavily.com')",
                },
            },
            "required": ["key_name", "description"],
        },
    },
    {
        "name": "list_env_vars",
        "description": "List all environment variables currently set for this agent. Returns key names only (values are hidden for security). Use this to check if a required API key is already configured.",
        "parameters": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "name": "update_agent_config",
        "description": "Update platform-level agent configuration like voice or STT provider. Only call this AFTER the user has explicitly chosen a voice from the list. Never auto-pick.",
        "parameters": {
            "type": "object",
            "properties": {
                "voice_id": {
                    "type": "string",
                    "description": "Resemble AI voice ID from the list_voices result. Must be the exact ID string from the list.",
                },
                "stt_provider": {
                    "type": "string",
                    "description": "Speech-to-text provider: 'assemblyai', 'deepgram', or 'elevenlabs'",
                    "enum": ["assemblyai", "deepgram", "elevenlabs"],
                },
            },
        },
    },
    {
        "name": "list_voices",
        "description": "List available Resemble AI voices compatible with chatterbox-turbo model. Use this to find the best voice for the agent based on its persona and language. Auto-pick the best match, set it, and tell the user. Offer to show the full list if they want to change.",
        "parameters": {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "description": "Filter by language name (e.g., 'English (US)', 'Spanish'). Defaults to 'English (US)' if not specified.",
                },
            },
        },
    },
]


def _execute_tool(func_name: str, args: dict, agent_id: str, db: Session, sse_events: list | None = None) -> str:
    """Execute an AI assistant tool call and return the result as a string.

    sse_events: if provided, tool can append SSE events to emit to the frontend.
    """
    if func_name == "request_env_var":
        key_name = args.get("key_name", "").strip().upper()
        description = args.get("description", key_name)
        help_url = args.get("help_url", "")
        if not key_name:
            return "Error: key_name is required."

        # Check if already set
        existing = db.query(AgentEnvVar).filter(
            AgentEnvVar.agent_id == agent_id, AgentEnvVar.key_name == key_name
        ).first()
        if existing:
            return f"{key_name} is already configured. No action needed."

        # Emit SSE event so frontend shows secure input form
        if sse_events is not None:
            sse_events.append({
                "type": "env_input_request",
                "key_name": key_name,
                "description": description,
                "help_url": help_url,
            })

        return f"A secure input form has been shown to the user for {key_name}. The user will enter the key directly — it won't pass through this conversation. Wait for the user to confirm they've saved it before continuing."

    elif func_name == "list_env_vars":
        env_vars = db.query(AgentEnvVar).filter(AgentEnvVar.agent_id == agent_id).all()
        if not env_vars:
            return "No environment variables are set for this agent."
        keys = [ev.key_name for ev in env_vars]
        return f"Environment variables set: {', '.join(keys)}"

    elif func_name == "update_agent_config":
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return "Error: Agent not found."
        config = agent.config or {}
        updated = []
        if "voice_id" in args and args["voice_id"]:
            config["voice_id"] = args["voice_id"]
            updated.append(f"voice_id={args['voice_id']}")
        if "stt_provider" in args and args["stt_provider"]:
            config["stt_provider"] = args["stt_provider"]
            updated.append(f"stt_provider={args['stt_provider']}")
        agent.config = config
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(agent, "config")
        db.commit()
        return f"Updated agent config: {', '.join(updated)}" if updated else "No changes made."

    elif func_name == "list_voices":
        try:
            from app.routers.resemble import _ensure_full_cache
            import asyncio

            language = args.get("language", "English (US)")

            # Get cached voices (uses our internal Resemble cache)
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # We're in a sync context called from async — use the cache directly
                    from app.routers.resemble import _all_voices
                    all_voices = _all_voices if _all_voices else []
                else:
                    all_voices = asyncio.run(_ensure_full_cache())
            except Exception:
                all_voices = []

            if not all_voices:
                return "No voices available. Make sure Resemble AI API key is configured in Settings > API Keys."

            # Filter by language, and exclude sample/base voices that don't work with chatterbox-turbo
            filtered = [
                v for v in all_voices
                if (not language or v.get("language", "") == language)
                and v.get("source") == "Resemble Voice"
            ]
            if not filtered:
                # Fallback: try language filter only without source filter
                filtered = [v for v in all_voices if not language or v.get("language", "") == language]
            if not filtered:
                filtered = [v for v in all_voices if v.get("source") == "Resemble Voice"]
            if not filtered:
                filtered = all_voices

            # Show up to 10 voices as a numbered list
            lines = []
            for i, v in enumerate(filtered[:10], 1):
                name = v.get("name", "Unknown")
                vid = v.get("id", "")
                lang = v.get("language", "")
                lines.append(f"{i}. **{name}** — {lang} (ID: `{vid}`)")

            result = "Available voices:\n\n" + "\n".join(lines)
            result += "\n\nPick the best voice for this agent's persona and language. Call `update_agent_config` with the chosen voice ID. Then tell the user which voice you picked and offer to show the full list if they want to change."
            return result
        except Exception as e:
            return f"Error fetching voices: {e}"

    return f"Unknown function: {func_name}"


def _sse(event_type: str, **kwargs) -> str:
    """Format an SSE event."""
    payload = {"type": event_type, **kwargs}
    return f"data: {json.dumps(payload)}\n\n"


def _gather_file_listing(agent_id: str, db: Session) -> list[dict]:
    """Get all files for the agent with metadata."""
    files = db.query(AgentFile).filter(AgentFile.agent_id == agent_id).all()
    return [
        {"file_path": f.file_path, "size_bytes": f.size_bytes or 0}
        for f in files
    ]


def _read_all_files(agent_id: str, db: Session) -> dict[str, str]:
    """Download all files and return {path: content}."""
    files = db.query(AgentFile).filter(AgentFile.agent_id == agent_id).all()
    result = {}
    for f in files:
        try:
            content = minio_client.download_file(agent_id, f.file_path)
            result[f.file_path] = content.decode("utf-8", errors="replace")
        except Exception:
            result[f.file_path] = "(could not read)"
    return result


def _format_context(file_contents: dict[str, str]) -> str:
    """Format file contents as context for the LLM."""
    parts = []
    for fp, content in sorted(file_contents.items()):
        parts.append(f"### {fp}\n```\n{content}\n```")
    return "\n\n".join(parts)


def _parse_file_changes(text: str) -> list[dict]:
    """Extract structured file changes from the LLM response."""
    changes: list[dict] = []
    pattern = r"FILE_CHANGE:\s*(create|update|delete)\s+(\S+)"
    code_block = r"```[\w]*\n(.*?)```"

    matches = list(re.finditer(pattern, text))
    code_blocks = list(re.finditer(code_block, text, re.DOTALL))

    for i, match in enumerate(matches):
        action = match.group(1)
        file_path = match.group(2)
        content: Optional[str] = None
        if action != "delete" and i < len(code_blocks):
            content = code_blocks[i].group(1)
        changes.append({"file_path": file_path, "action": action, "content": content})

    return changes


def _save_file_to_storage(
    agent_id: str, file_path: str, content: str, db: Session
) -> dict:
    """Save a file to MinIO and update DB record. Returns metadata."""
    content_bytes = content.encode("utf-8")
    content_hash = hashlib.sha256(content_bytes).hexdigest()[:16]

    # Upload to MinIO
    minio_client.upload_file(agent_id, file_path, content_bytes)

    # Update or create DB record
    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == file_path)
        .first()
    )
    if agent_file:
        agent_file.content_hash = content_hash
        agent_file.size_bytes = len(content_bytes)
        agent_file.version = (agent_file.version or 0) + 1
    else:
        agent_file = AgentFile(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            file_path=file_path,
            content_hash=content_hash,
            size_bytes=len(content_bytes),
            version=1,
        )
        db.add(agent_file)

    db.commit()
    return {
        "file_path": file_path,
        "size_bytes": len(content_bytes),
        "version": agent_file.version,
    }


def _delete_file_from_storage(agent_id: str, file_path: str, db: Session) -> None:
    """Delete a file from MinIO and DB."""
    try:
        minio_client.delete_file(agent_id, file_path)
    except Exception:
        pass
    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == file_path)
        .first()
    )
    if agent_file:
        db.delete(agent_file)
        db.commit()


# ---- Conversation CRUD endpoints ----


@router.get("/conversations")
async def list_conversations(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """List all conversations for this agent, newest first."""
    convs = (
        db.query(
            CodingAgentConversation,
            func.count(CodingAgentMessage.id).label("message_count"),
        )
        .outerjoin(CodingAgentMessage)
        .filter(CodingAgentConversation.agent_id == agent_id)
        .group_by(CodingAgentConversation.id)
        .order_by(CodingAgentConversation.updated_at.desc())
        .all()
    )
    return [
        ConversationListItem(
            id=c.id,
            title=c.title,
            created_at=c.created_at,
            updated_at=c.updated_at,
            message_count=count,
        )
        for c, count in convs
    ]


@router.post("/conversations")
async def create_conversation(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
    user: User = Depends(get_current_user),
):
    """Create a new empty conversation."""
    conv = CodingAgentConversation(
        id=str(uuid.uuid4()),
        agent_id=agent_id,
        user_id=user.auth_id,
        title="New conversation",
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": conv.id, "title": conv.title}


@router.get("/conversations/{conv_id}")
async def get_conversation(
    conv_id: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Get a conversation with all its messages."""
    conv = db.query(CodingAgentConversation).filter(
        CodingAgentConversation.id == conv_id,
        CodingAgentConversation.agent_id == agent_id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        messages=[
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                file_changes=m.file_changes,
                created_at=m.created_at,
            )
            for m in conv.messages
        ],
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.delete("/conversations/{conv_id}")
async def delete_conversation(
    conv_id: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Delete a conversation and all its messages."""
    conv = db.query(CodingAgentConversation).filter(
        CodingAgentConversation.id == conv_id,
        CodingAgentConversation.agent_id == agent_id,
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return {"ok": True}


# ---- Chat streaming endpoint ----


@router.post("/chat")
async def chat_stream(
    request: CodingAgentRequest,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _=Depends(require_providers("google")),
    _agent: Agent = Depends(verify_agent_ownership),
    user: User = Depends(get_current_user),
):
    """Stream coding agent responses with Cursor-like rich events."""

    request.agent_id = agent_id
    google_api_key = get_key(db, "google_api_key")

    async def event_stream():
        full_text = ""
        try:
            # Resolve or create conversation
            conv_id = request.conversation_id
            if conv_id:
                conv = db.query(CodingAgentConversation).filter(
                    CodingAgentConversation.id == conv_id,
                    CodingAgentConversation.agent_id == agent_id,
                ).first()
                if not conv:
                    yield _sse("error", content="Conversation not found")
                    return
            else:
                title = request.prompt[:80].strip()
                if len(request.prompt) > 80:
                    title += "..."
                conv = CodingAgentConversation(
                    id=str(uuid.uuid4()),
                    agent_id=agent_id,
                    user_id=user.auth_id,
                    title=title,
                )
                db.add(conv)
                db.commit()
                db.refresh(conv)
                conv_id = conv.id

            yield _sse("conversation", id=conv_id, title=conv.title)

            # Save user message
            user_msg = CodingAgentMessage(
                id=str(uuid.uuid4()),
                conversation_id=conv_id,
                role="user",
                content=request.prompt,
            )
            db.add(user_msg)
            db.commit()

            # Phase 1: Read files and build context
            yield _sse("status", message="Reading agent files...")

            file_listing = _gather_file_listing(agent_id, db)
            for f in file_listing:
                yield _sse("file_read", file_path=f["file_path"], size_bytes=f["size_bytes"])

            file_contents = _read_all_files(agent_id, db)
            context = _format_context(file_contents)

            yield _sse("status", message=f"Read {len(file_contents)} files")

            # Build the user message with context
            user_message = request.prompt
            if context:
                user_message = (
                    f"Here are the current agent files:\n\n{context}\n\n"
                    f"User request: {request.prompt}"
                )

            # Phase 2: Call LLM with multi-turn history
            yield _sse("status", message="Thinking...")

            from google import genai as genai_client
            from google.genai import types as genai_types

            client = genai_client.Client(api_key=google_api_key)

            # Build chat history from previous messages
            previous_messages = (
                db.query(CodingAgentMessage)
                .filter(
                    CodingAgentMessage.conversation_id == conv_id,
                    CodingAgentMessage.id != user_msg.id,
                )
                .order_by(CodingAgentMessage.created_at)
                .all()
            )

            history = []
            for msg in previous_messages:
                role = "user" if msg.role == "user" else "model"
                history.append(genai_types.Content(
                    role=role,
                    parts=[genai_types.Part(text=msg.content)],
                ))

            # Configure with function calling + search grounding
            config = genai_types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=[
                    genai_types.Tool(
                        google_search=genai_types.GoogleSearch(),
                        function_declarations=ASSISTANT_FUNCTIONS,
                    ),
                ],
                tool_config=genai_types.ToolConfig(
                    include_server_side_tool_invocations=True,
                ),
            )

            # Build the full contents: history + current user message
            contents = history + [
                genai_types.Content(
                    role="user",
                    parts=[genai_types.Part(text=user_message)],
                )
            ]

            # Function calling loop — keep going until no more function calls
            max_tool_rounds = 5
            for _round in range(max_tool_rounds):
                response = client.models.generate_content(
                    model=CODING_MODEL,
                    contents=contents,
                    config=config,
                )

                # Process all parts in the response
                has_function_calls = False
                function_response_parts = []

                for part in response.candidates[0].content.parts:
                    if part.text:
                        full_text += part.text
                        yield _sse("chunk", content=part.text)

                    if part.function_call:
                        has_function_calls = True
                        fc = part.function_call
                        func_name = fc.name
                        func_args = dict(fc.args) if fc.args else {}

                        yield _sse("status", message=f"Running {func_name}...")
                        logger.info(f"[coding-agent] Tool call: {func_name}({func_args})")

                        # Execute the tool
                        pending_sse_events = []
                        result = _execute_tool(func_name, func_args, agent_id, db, sse_events=pending_sse_events)

                        # Emit any SSE events from the tool (e.g., env_input_request)
                        for evt in pending_sse_events:
                            yield _sse(**evt)

                        yield _sse("status", message=f"{func_name} completed")

                        # Build function response part
                        function_response_parts.append(
                            genai_types.Part.from_function_response(
                                name=func_name,
                                response={"result": result},
                            )
                        )

                if not has_function_calls:
                    break

                # Append model response + function results to contents for next round
                contents.append(response.candidates[0].content)
                contents.append(genai_types.Content(
                    role="user",
                    parts=function_response_parts,
                ))

            # Phase 3: Parse and auto-apply file changes
            file_changes = _parse_file_changes(full_text)
            applied_changes = []

            if file_changes:
                yield _sse("status", message=f"Applying {len(file_changes)} file change(s)...")

                for change in file_changes:
                    fp = change["file_path"]
                    action = change["action"]
                    content = change.get("content")

                    if action == "delete":
                        if fp == "agent.py":
                            yield _sse("file_error", file_path=fp, error="Cannot delete agent.py")
                            continue
                        _delete_file_from_storage(agent_id, fp, db)
                        yield _sse("file_write", file_path=fp, action="delete")
                        applied_changes.append(change)

                    elif action in ("create", "update") and content is not None:
                        meta = _save_file_to_storage(agent_id, fp, content, db)
                        yield _sse(
                            "file_write",
                            file_path=fp,
                            action=action,
                            size_bytes=meta["size_bytes"],
                            version=meta["version"],
                        )
                        applied_changes.append(change)

                yield _sse(
                    "file_changes",
                    file_changes=applied_changes,
                    auto_applied=True,
                )

            # Save assistant message
            assistant_msg = CodingAgentMessage(
                id=str(uuid.uuid4()),
                conversation_id=conv_id,
                role="assistant",
                content=full_text,
                file_changes=[
                    {"file_path": c["file_path"], "action": c["action"]}
                    for c in applied_changes
                ] if applied_changes else None,
            )
            db.add(assistant_msg)
            conv.updated_at = datetime.utcnow()
            db.commit()

            yield _sse("done")

        except Exception as exc:
            logger.exception("Coding agent LLM call failed")
            yield _sse("error", content=str(exc))

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
