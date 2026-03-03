"""Coding agent service — calls Google Gemini to assist with agent code."""

import re
import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import AgentFile
from app.schemas import CodingAgentRequest, CodingAgentResponse, FileChange
from app.services import minio_client
from app.services.coding_agent_prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


def _gather_context(agent_id: str, context_files: list[str], db: Session) -> str:
    """Download requested files and format them as context for the LLM."""
    parts: list[str] = []
    files = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id)
        .all()
    )
    file_map = {f.file_path: f for f in files}

    targets = context_files if context_files else list(file_map.keys())
    for fp in targets:
        if fp not in file_map:
            continue
        try:
            content = minio_client.download_file(agent_id, fp).decode("utf-8", errors="replace")
            parts.append(f"### {fp}\n```\n{content}\n```")
        except Exception:
            parts.append(f"### {fp}\n(could not read)")

    return "\n\n".join(parts)


def _parse_file_changes(text: str) -> list[FileChange]:
    """Extract structured file changes from the LLM response."""
    changes: list[FileChange] = []
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
        changes.append(FileChange(file_path=file_path, action=action, content=content))

    return changes


async def chat(request: CodingAgentRequest, db: Session) -> CodingAgentResponse:
    """Send a prompt to the coding agent LLM and return structured output."""
    settings = get_settings()

    context = _gather_context(request.agent_id, request.context_files, db)
    user_message = request.prompt
    if context:
        user_message = f"Here are the current agent files:\n\n{context}\n\nUser request: {request.prompt}"

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )
        response = await model.generate_content_async(user_message)
        reply_text = response.text
    except Exception as exc:
        logger.exception("Coding agent LLM call failed")
        return CodingAgentResponse(
            message=f"LLM call failed: {exc}",
            file_changes=[],
            applied=False,
        )

    file_changes = _parse_file_changes(reply_text)

    return CodingAgentResponse(
        message=reply_text,
        file_changes=file_changes,
        applied=False,
    )
