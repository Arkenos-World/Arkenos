"""Environment variable management for custom agents."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, AgentEnvVar
from app.dependencies import verify_agent_ownership
from app.services.encryption import encrypt, decrypt

router = APIRouter()


class EnvVarCreate(BaseModel):
    key_name: str
    value: str


class EnvVarResponse(BaseModel):
    id: str
    key_name: str
    has_value: bool  # Never expose the actual value


class EnvVarListResponse(BaseModel):
    env_vars: list[EnvVarResponse]


@router.get("/", response_model=EnvVarListResponse)
async def list_env_vars(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """List all environment variables for this agent (keys only, no values)."""
    env_vars = (
        db.query(AgentEnvVar)
        .filter(AgentEnvVar.agent_id == agent_id)
        .order_by(AgentEnvVar.key_name)
        .all()
    )
    return EnvVarListResponse(
        env_vars=[
            EnvVarResponse(id=ev.id, key_name=ev.key_name, has_value=True)
            for ev in env_vars
        ]
    )


@router.post("/", status_code=201)
async def set_env_var(
    body: EnvVarCreate,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Set an environment variable (create or update)."""
    key_name = body.key_name.strip().upper()
    if not key_name:
        raise HTTPException(status_code=400, detail="Key name is required")

    # Block overriding platform env vars
    RESERVED = {
        "LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET",
        "AGENT_ID", "AGENT_NAME", "ROOM_NAME", "SESSION_ID",
        "MINIO_ENDPOINT", "MINIO_ACCESS_KEY", "MINIO_SECRET_KEY", "MINIO_BUCKET",
        "BACKEND_API_URL", "GOOGLE_API_KEY", "RESEMBLE_API_KEY",
        "RESEMBLE_VOICE_UUID", "ASSEMBLYAI_API_KEY", "DEEPGRAM_API_KEY",
    }
    if key_name in RESERVED:
        raise HTTPException(status_code=400, detail=f"'{key_name}' is a reserved platform variable")

    existing = (
        db.query(AgentEnvVar)
        .filter(AgentEnvVar.agent_id == agent_id, AgentEnvVar.key_name == key_name)
        .first()
    )

    encrypted = encrypt(body.value)

    if existing:
        existing.encrypted_value = encrypted
        db.commit()
        return {"id": existing.id, "key_name": key_name, "updated": True}
    else:
        env_var = AgentEnvVar(
            id=str(uuid.uuid4()),
            agent_id=agent_id,
            key_name=key_name,
            encrypted_value=encrypted,
        )
        db.add(env_var)
        db.commit()
        return {"id": env_var.id, "key_name": key_name, "created": True}


@router.delete("/{key_name}", status_code=204)
async def delete_env_var(
    key_name: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Delete an environment variable."""
    env_var = (
        db.query(AgentEnvVar)
        .filter(AgentEnvVar.agent_id == agent_id, AgentEnvVar.key_name == key_name.upper())
        .first()
    )
    if not env_var:
        raise HTTPException(status_code=404, detail=f"Environment variable '{key_name}' not found")
    db.delete(env_var)
    db.commit()
    return None
