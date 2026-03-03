"""File management router for custom agents."""

import hashlib
import mimetypes
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, AgentFile, AgentFileVersion, AgentMode
from app.schemas import (
    AgentFileContentResponse,
    AgentFileCreateUpdate,
    AgentFileResponse,
    AgentFileTreeResponse,
)
from app.services import minio_client
from app.services.scaffold_templates import scaffold_agent
from app.dependencies import verify_agent_ownership

router = APIRouter()

ALLOWED_EXTENSIONS = {".py", ".txt", ".yaml", ".yml", ".json", ".md", ".toml"}
MAX_FILE_SIZE = 1_048_576  # 1 MB


def _validate_path(file_path: str) -> None:
    """Reject path traversal and disallowed extensions."""
    if ".." in file_path or file_path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid file path")
    ext = os.path.splitext(file_path)[1].lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


# ---- Endpoints ----


@router.get("/", response_model=AgentFileTreeResponse)
async def list_files(agent_id: str = Path(...), db: Session = Depends(get_db), _agent: Agent = Depends(verify_agent_ownership)):
    """List all files for a custom agent."""
    files = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id)
        .order_by(AgentFile.file_path)
        .all()
    )
    total_size = sum(f.size_bytes for f in files)
    return AgentFileTreeResponse(agent_id=agent_id, files=files, total_size_bytes=total_size)


@router.post("/scaffold", response_model=AgentFileTreeResponse, status_code=201)
async def scaffold(agent_id: str = Path(...), db: Session = Depends(get_db), _agent: Agent = Depends(verify_agent_ownership)):
    """Initialize the default folder structure for a custom agent."""
    existing = db.query(AgentFile).filter(AgentFile.agent_id == agent_id).count()
    if existing > 0:
        raise HTTPException(status_code=409, detail="Agent already has files; scaffold refused")

    created = scaffold_agent(agent_id, db)
    total_size = sum(f.size_bytes for f in created)
    return AgentFileTreeResponse(agent_id=agent_id, files=created, total_size_bytes=total_size)


@router.get("/{path:path}/versions", response_model=list[dict])
async def list_versions(
    path: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """List all versions of a file."""
    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == path)
        .first()
    )
    if not agent_file:
        raise HTTPException(status_code=404, detail="File not found")

    versions = (
        db.query(AgentFileVersion)
        .filter(AgentFileVersion.agent_file_id == agent_file.id)
        .order_by(AgentFileVersion.version.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "version": v.version,
            "content_hash": v.content_hash,
            "size_bytes": v.size_bytes,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]


@router.post("/{path:path}/rollback")
async def rollback_file(
    path: str,
    version: int,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Rollback a file to a specific version."""
    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == path)
        .first()
    )
    if not agent_file:
        raise HTTPException(status_code=404, detail="File not found")

    version_record = (
        db.query(AgentFileVersion)
        .filter(
            AgentFileVersion.agent_file_id == agent_file.id,
            AgentFileVersion.version == version,
        )
        .first()
    )
    if not version_record:
        raise HTTPException(status_code=404, detail=f"Version {version} not found")

    # Download versioned content and overwrite current
    try:
        client = minio_client.get_client()
        bucket = minio_client.get_settings().minio_bucket
        resp = client.get_object(bucket, version_record.minio_key)
        content = resp.read()
        resp.close()
        resp.release_conn()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch version: {exc}")

    minio_client.upload_file(agent_id, path, content)

    # Create a new version record for the rollback
    new_version = agent_file.version + 1
    new_minio_key = minio_client.upload_version(agent_id, path, new_version, content)
    new_version_record = AgentFileVersion(
        id=str(uuid.uuid4()),
        agent_file_id=agent_file.id,
        version=new_version,
        content_hash=version_record.content_hash,
        minio_key=new_minio_key,
        size_bytes=len(content),
    )
    db.add(new_version_record)

    agent_file.version = new_version
    agent_file.content_hash = version_record.content_hash
    agent_file.size_bytes = len(content)
    db.commit()

    return {"message": f"Rolled back to version {version}", "new_version": new_version}


@router.get("/{path:path}", response_model=AgentFileContentResponse)
async def read_file(
    path: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Read the content of a single agent file."""
    _validate_path(path)

    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == path)
        .first()
    )
    if not agent_file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        content_bytes = minio_client.download_file(agent_id, path)
    except Exception:
        raise HTTPException(status_code=404, detail="File content not found in storage")

    return AgentFileContentResponse(
        file_path=path,
        content=content_bytes.decode("utf-8", errors="replace"),
        version=agent_file.version,
        size_bytes=agent_file.size_bytes,
        mime_type=agent_file.mime_type,
    )


@router.put("/{path:path}", response_model=AgentFileResponse, status_code=200)
async def create_or_update_file(
    path: str,
    body: AgentFileCreateUpdate,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Create or update an agent file with automatic versioning."""
    _validate_path(path)

    content_bytes = body.content.encode("utf-8")
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 1 MB limit")

    content_hash = hashlib.sha256(content_bytes).hexdigest()
    size_bytes = len(content_bytes)
    mime_type = mimetypes.guess_type(path)[0] or "text/plain"

    minio_client.ensure_bucket()
    minio_client.upload_file(agent_id, path, content_bytes)

    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == path)
        .first()
    )

    if agent_file:
        # Update existing file
        agent_file.version += 1
        agent_file.content_hash = content_hash
        agent_file.size_bytes = size_bytes
        agent_file.mime_type = mime_type
    else:
        # Create new file
        agent_file = AgentFile(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            file_path=path,
            content_hash=content_hash,
            size_bytes=size_bytes,
            mime_type=mime_type,
            version=1,
        )
        db.add(agent_file)
        db.flush()

    # Store versioned copy
    minio_key = minio_client.upload_version(agent_id, path, agent_file.version, content_bytes)
    version_record = AgentFileVersion(
        id=str(uuid.uuid4()),
        agent_file_id=agent_file.id,
        version=agent_file.version,
        content_hash=content_hash,
        minio_key=minio_key,
        size_bytes=size_bytes,
    )
    db.add(version_record)

    # Bump agent current_version
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent:
        agent.current_version += 1

    db.commit()
    db.refresh(agent_file)
    return agent_file


@router.delete("/{path:path}", status_code=204)
async def delete_file(
    path: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Delete an agent file. agent.py cannot be deleted."""

    if path == "agent.py":
        raise HTTPException(status_code=403, detail="Cannot delete agent.py — it is required")

    agent_file = (
        db.query(AgentFile)
        .filter(AgentFile.agent_id == agent_id, AgentFile.file_path == path)
        .first()
    )
    if not agent_file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        minio_client.delete_file(agent_id, path)
    except Exception:
        pass  # File may already be gone from storage

    db.delete(agent_file)
    db.commit()
    return None
