"""Container management router for custom agents."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, AgentContainer, AgentBuildStatus
from app.schemas import BuildStatusResponse, ContainerResponse
from app.services import container_orchestrator, image_builder
from app.dependencies import verify_agent_ownership

router = APIRouter()


class PreviewRequest(BaseModel):
    room_name: Optional[str] = None


@router.post("/preview", response_model=ContainerResponse, status_code=201)
async def preview_container(
    body: PreviewRequest = PreviewRequest(),
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Spin up a preview container for the custom agent."""
    # Use the room name from the request (from the frontend token flow)
    # or generate one if called directly (e.g., from the Preview button)
    if body.room_name:
        room_name = body.room_name
    else:
        preview_id = str(uuid.uuid4())[:8]
        room_name = f"preview-{agent_id[:8]}-{preview_id}"

    try:
        record_id = container_orchestrator.spawn_container(
            agent_id=agent_id,
            session_id=None,
            container_type="preview",
            room_name=room_name,
            db=db,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to start container: {exc}")

    record = db.query(AgentContainer).filter(AgentContainer.id == record_id).first()
    return record


@router.post("/deploy")
async def deploy(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Mark the current version as deployed."""
    agent.deployed_version = agent.current_version
    db.commit()
    return {
        "message": "Deployed successfully",
        "deployed_version": agent.deployed_version,
    }


@router.get("/", response_model=list[ContainerResponse])
async def list_containers(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """List all containers for an agent."""
    containers = (
        db.query(AgentContainer)
        .filter(AgentContainer.agent_id == agent_id)
        .order_by(AgentContainer.created_at.desc())
        .all()
    )
    return containers


@router.get("/build-status", response_model=BuildStatusResponse)
async def build_status(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Get the build status for an agent."""
    return BuildStatusResponse(
        agent_id=agent.id,
        build_status=agent.build_status,
        build_error=agent.build_error,
        current_version=agent.current_version,
        deployed_version=agent.deployed_version,
        image_tag=agent.image_tag,
        last_build_at=agent.last_build_at,
    )


@router.post("/build", response_model=BuildStatusResponse)
async def trigger_build(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Trigger a Docker image rebuild for the agent."""
    if agent.build_status == AgentBuildStatus.BUILDING:
        raise HTTPException(status_code=409, detail="A build is already in progress")

    agent.build_status = AgentBuildStatus.PENDING
    db.commit()

    try:
        image_tag = image_builder.build_custom_image(agent_id, db)
    except Exception as exc:
        db.refresh(agent)
        raise HTTPException(status_code=500, detail=f"Build failed: {exc}")

    db.refresh(agent)
    return BuildStatusResponse(
        agent_id=agent.id,
        build_status=agent.build_status,
        build_error=agent.build_error,
        current_version=agent.current_version,
        deployed_version=agent.deployed_version,
        image_tag=agent.image_tag,
        last_build_at=agent.last_build_at,
    )


@router.post("/stop", status_code=200)
async def stop_latest(
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Stop the most recent running container for this agent."""
    from app.models import ContainerStatus

    record = (
        db.query(AgentContainer)
        .filter(
            AgentContainer.agent_id == agent_id,
            AgentContainer.status.in_([ContainerStatus.RUNNING, ContainerStatus.PENDING]),
        )
        .order_by(AgentContainer.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No running container found")

    try:
        container_orchestrator.stop_container(record.id, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to stop container: {exc}")

    return {"message": "Container stopped", "container_id": record.id}


@router.get("/logs")
async def latest_container_logs(
    agent_id: str = Path(...),
    tail: int = 100,
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Get logs from the most recent container for this agent."""
    from app.models import ContainerStatus

    record = (
        db.query(AgentContainer)
        .filter(AgentContainer.agent_id == agent_id)
        .order_by(AgentContainer.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No container found")

    logs = container_orchestrator.get_logs(record.id, db, tail=tail)
    return {"container_id": record.id, "logs": logs}


@router.get("/{container_id}/logs")
async def container_logs(
    container_id: str,
    agent_id: str = Path(...),
    tail: int = 100,
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Get stdout/stderr logs from a specific container."""
    record = (
        db.query(AgentContainer)
        .filter(AgentContainer.id == container_id, AgentContainer.agent_id == agent_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Container not found")

    logs = container_orchestrator.get_logs(container_id, db, tail=tail)
    return {"container_id": container_id, "logs": logs}


@router.delete("/{container_id}", status_code=204)
async def force_stop(
    container_id: str,
    agent_id: str = Path(...),
    db: Session = Depends(get_db),
    _agent: Agent = Depends(verify_agent_ownership),
):
    """Force stop and remove a container."""
    record = (
        db.query(AgentContainer)
        .filter(AgentContainer.id == container_id, AgentContainer.agent_id == agent_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Container not found")

    try:
        container_orchestrator.stop_container(container_id, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to stop container: {exc}")

    return None
