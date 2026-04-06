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


def _resolve_env(agent: Agent, db: Session) -> dict[str, str]:
    """Build container environment variables, resolving keys from the org's DB
    with fallback to backend config settings."""
    from app.services.config_resolver import get_key

    settings = get_settings()

    def _key(name: str, fallback: str = "") -> str:
        """Try DB first (org-scoped), then settings, then empty."""
        try:
            val = get_key(db, name)
            if val:
                return val
        except Exception:
            pass
        return getattr(settings, name, "") or fallback

    # Resolve voice UUID: agent config > env > empty
    voice_uuid = ""
    if agent.config and isinstance(agent.config, dict):
        voice_uuid = agent.config.get("voice_id", "")
    if not voice_uuid:
        voice_uuid = _key("resemble_voice_uuid", settings.resemble_voice_uuid)

    env = {
        "LIVEKIT_URL": _key("livekit_url"),
        "LIVEKIT_API_KEY": _key("livekit_api_key"),
        "LIVEKIT_API_SECRET": _key("livekit_api_secret"),
        "GOOGLE_API_KEY": _key("google_api_key"),
        "RESEMBLE_API_KEY": _key("resemble_api_key"),
        "RESEMBLE_VOICE_UUID": voice_uuid,
        "ASSEMBLYAI_API_KEY": _key("assemblyai_api_key"),
        "DEEPGRAM_API_KEY": _key("deepgram_api_key"),
        "MINIO_ENDPOINT": "arkenos-minio:9000",
        "MINIO_ACCESS_KEY": settings.minio_access_key,
        "MINIO_SECRET_KEY": settings.minio_secret_key,
        "MINIO_BUCKET": settings.minio_bucket,
        "MINIO_SECURE": "false",
        "BACKEND_API_URL": "http://host.docker.internal:8000/api",
    }

    # Inject agent-scoped custom environment variables
    from app.models import AgentEnvVar
    from app.services.encryption import decrypt
    agent_env_vars = db.query(AgentEnvVar).filter(AgentEnvVar.agent_id == agent.id).all()
    for ev in agent_env_vars:
        try:
            env[ev.key_name] = decrypt(ev.encrypted_value)
        except Exception:
            logger.warning(f"Failed to decrypt env var {ev.key_name} for agent {agent.id}")

    return env


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
        agent_name = f"arkenos-custom-{agent_id}"
        env = _resolve_env(agent, db)
        env["ROOM_NAME"] = room_name
        env["AGENT_ID"] = agent_id
        env["AGENT_NAME"] = agent_name
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


def deploy_worker(agent_id: str, db: Session) -> str:
    """Start a persistent worker container for a custom agent.

    Unlike spawn_container (which connects to a specific room), this starts
    the container in worker mode — it registers with LiveKit as
    'arkenos-custom-{agent_id}' and accepts dispatched calls.

    Stops any existing running worker for this agent first.

    Returns the AgentContainer.id (our internal record id).
    """
    settings = get_settings()
    image_tag = get_image_for_agent(agent_id, db)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise ValueError(f"Agent {agent_id} not found")

    # Stop any existing worker containers for this agent
    existing_workers = (
        db.query(AgentContainer)
        .filter(
            AgentContainer.agent_id == agent_id,
            AgentContainer.container_type == "worker",
            AgentContainer.status.in_([ContainerStatus.RUNNING, ContainerStatus.PENDING]),
        )
        .all()
    )
    for existing in existing_workers:
        try:
            stop_container(existing.id, db)
            logger.info(f"Stopped existing worker container {existing.id} for agent {agent_id}")
        except Exception:
            logger.warning(f"Failed to stop existing worker {existing.id}, continuing")

    record_id = str(uuid.uuid4())
    agent_name = f"arkenos-custom-{agent_id}"
    record = AgentContainer(
        id=record_id,
        agent_id=agent_id,
        session_id=None,
        container_type="worker",
        status=ContainerStatus.PENDING,
        image_tag=image_tag,
    )
    db.add(record)
    db.commit()

    try:
        client = _docker_client()
        env = _resolve_env(agent, db)
        env["AGENT_ID"] = agent_id
        env["AGENT_NAME"] = agent_name
        # No ROOM_NAME — worker mode: entrypoint_loader runs `agent start`

        labels = {
            "arkenos.agent_id": agent_id,
            "arkenos.container_type": "worker",
            "arkenos.agent_name": agent_name,
        }

        container_name = f"arkenos-worker-{agent_id[:8]}-{record_id[:8]}"

        container = client.containers.run(
            image_tag,
            detach=True,
            name=container_name,
            network=settings.container_network,
            environment=env,
            labels=labels,
            remove=False,
            restart_policy={"Name": "unless-stopped"},
        )
        record.container_id = container.id
        record.status = ContainerStatus.RUNNING
        record.started_at = datetime.utcnow()
        db.commit()

        logger.info(
            f"Deployed persistent worker for agent {agent_id}: "
            f"container={container_name}, agent_name={agent_name}, image={image_tag}"
        )
        return record_id

    except Exception as exc:
        record.status = ContainerStatus.FAILED
        record.error_message = str(exc)[:2000]
        db.commit()
        raise


def is_worker_running(agent_id: str, db: Session) -> bool:
    """Check if a persistent worker container is running for this agent."""
    record = (
        db.query(AgentContainer)
        .filter(
            AgentContainer.agent_id == agent_id,
            AgentContainer.container_type == "worker",
            AgentContainer.status == ContainerStatus.RUNNING,
        )
        .first()
    )
    if not record or not record.container_id:
        return False

    # Verify the Docker container is actually alive
    try:
        client = _docker_client()
        container = client.containers.get(record.container_id)
        if container.status == "running":
            return True
        # Container died — update our record
        record.status = ContainerStatus.STOPPED
        record.stopped_at = datetime.utcnow()
        db.commit()
        return False
    except docker.errors.NotFound:
        record.status = ContainerStatus.STOPPED
        record.stopped_at = datetime.utcnow()
        db.commit()
        return False
    except Exception:
        return False


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

