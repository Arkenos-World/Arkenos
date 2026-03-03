"""Coding AI assistant router for custom agents — Cursor-like streaming experience."""

import json
import re
import logging
import hashlib
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import Agent, AgentFile
from app.schemas import CodingAgentRequest
from app.services import minio_client
from app.services.coding_agent_prompt import SYSTEM_PROMPT
from app.dependencies import verify_agent_ownership

logger = logging.getLogger(__name__)
router = APIRouter()

CODING_MODEL = "gemini-2.5-flash"


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
        import uuid
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


@router.post("/chat")
async def chat_stream(
    request: CodingAgentRequest,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Stream coding agent responses with Cursor-like rich events."""

    request.agent_id = agent_id
    settings = get_settings()

    async def event_stream():
        full_text = ""
        try:
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

            # Phase 2: Call LLM with streaming
            yield _sse("status", message="Thinking...")

            import google.generativeai as genai

            genai.configure(api_key=settings.google_api_key)
            model = genai.GenerativeModel(
                CODING_MODEL,
                system_instruction=SYSTEM_PROMPT,
            )

            response = await model.generate_content_async(user_message, stream=True)

            async for chunk in response:
                if chunk.text:
                    full_text += chunk.text
                    yield _sse("chunk", content=chunk.text)

            # Phase 3: Parse and auto-apply file changes
            file_changes = _parse_file_changes(full_text)

            if file_changes:
                yield _sse("status", message=f"Applying {len(file_changes)} file change(s)...")

                applied_changes = []
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
