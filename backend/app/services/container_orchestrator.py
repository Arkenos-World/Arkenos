"""Container lifecycle management for custom agents."""

import logging
import uuid
from datetime import datetime

import docker
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Agent, AgentContainer, ContainerStatus
from app.services.image_builder import get_image_for_agent

logger = logging.getLogger(__name__)


def _docker_client() -> docker.DockerClient:
    settings = get_settings()
    return docker.DockerClient(base_url=settings.docker_socket)


def spawn_container(
    agent_id: str,
    session_id: str | None,
    container_type: str,
    room_name: str,
    db: Session,
) -> str:
    """Create and start a Docker container for a custom agent session.

    Returns the AgentContainer.id (our internal record id).
    """
    settings = get_settings()
    image_tag = get_image_for_agent(agent_id, db)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise ValueError(f"Agent {agent_id} not found")

    record_id = str(uuid.uuid4())
    record = AgentContainer(
        id=record_id,
        agent_id=agent_id,
        session_id=session_id,
        container_type=container_type,
        status=ContainerStatus.PENDING,
        image_tag=image_tag,
    )
    db.add(record)
    db.commit()

    try:
        client = _docker_client()
        env = {
            "LIVEKIT_URL": settings.livekit_url,
            "LIVEKIT_API_KEY": settings.livekit_api_key,
            "LIVEKIT_API_SECRET": settings.livekit_api_secret,
            "ROOM_NAME": room_name,
            "AGENT_ID": agent_id,
            # Inside the Docker network, use container names not localhost
            "MINIO_ENDPOINT": "arkenos-minio:9000",
            "MINIO_ACCESS_KEY": settings.minio_access_key,
            "MINIO_SECRET_KEY": settings.minio_secret_key,
            "MINIO_BUCKET": settings.minio_bucket,
            "MINIO_SECURE": "false",
            "GOOGLE_API_KEY": settings.google_api_key,
            "RESEMBLE_API_KEY": settings.resemble_api_key,
            "RESEMBLE_VOICE_UUID": settings.resemble_voice_uuid,
            "ASSEMBLYAI_API_KEY": settings.assemblyai_api_key,
            "DEEPGRAM_API_KEY": settings.deepgram_api_key,
            "BACKEND_API_URL": "http://host.docker.internal:8000/api",
        }
        if session_id:
            env["SESSION_ID"] = session_id

        labels = {
            "arkenos.agent_id": agent_id,
            "arkenos.container_type": container_type,
        }
        if session_id:
            labels["arkenos.session_id"] = session_id

        container = client.containers.run(
            image_tag,
            detach=True,
            name=f"arkenos-agent-{agent_id[:8]}-{record_id[:8]}",
            network=settings.container_network,
            environment=env,
            labels=labels,
            remove=False,
        )
        record.container_id = container.id
        record.status = ContainerStatus.RUNNING
        record.started_at = datetime.utcnow()
        db.commit()
        return record_id

    except Exception as exc:
        record.status = ContainerStatus.FAILED
        record.error_message = str(exc)[:2000]
        db.commit()
        raise


def stop_container(container_id: str, db: Session) -> None:
    """Gracefully stop and remove a container by our internal record id."""
    record = db.query(AgentContainer).filter(AgentContainer.id == container_id).first()
    if not record:
        raise ValueError(f"Container record {container_id} not found")

    if record.container_id:
        try:
            client = _docker_client()
            container = client.containers.get(record.container_id)
            container.stop(timeout=10)
            container.remove(force=True)
        except docker.errors.NotFound:
            logger.info("Container %s already removed", record.container_id)
        except Exception as exc:
            logger.error("Error stopping container %s: %s", record.container_id, exc)

    record.status = ContainerStatus.STOPPED
    record.stopped_at = datetime.utcnow()
    db.commit()


def get_logs(container_id: str, db: Session, tail: int = 100) -> str:
    """Fetch stdout/stderr logs from a running or stopped container."""
    record = db.query(AgentContainer).filter(AgentContainer.id == container_id).first()
    if not record or not record.container_id:
        return ""

    try:
        client = _docker_client()
        container = client.containers.get(record.container_id)
        logs = container.logs(stdout=True, stderr=True, tail=tail)
        return logs.decode("utf-8", errors="replace")
    except docker.errors.NotFound:
        return "[container removed]"
    except Exception as exc:
        return f"[error fetching logs: {exc}]"


def cleanup_expired(db: Session) -> int:
    """Stop containers that have exceeded the configured timeout.

    Returns the number of containers cleaned up.
    """
    settings = get_settings()
    cutoff = datetime.utcnow()
    running = (
        db.query(AgentContainer)
        .filter(
            AgentContainer.status == ContainerStatus.RUNNING,
            AgentContainer.started_at.isnot(None),
        )
        .all()
    )
    cleaned = 0
    for record in running:
        if record.started_at and (cutoff - record.started_at).total_seconds() > settings.container_timeout_seconds:
            try:
                stop_container(record.id, db)
                cleaned += 1
            except Exception:
                logger.exception("Failed to cleanup container %s", record.id)
    return cleaned

