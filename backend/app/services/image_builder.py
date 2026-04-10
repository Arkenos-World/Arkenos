"""Docker image builder for custom agents."""

import hashlib
import logging
import os
from datetime import datetime
from pathlib import Path

import docker
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import Agent, AgentBuildStatus
from app.services import minio_client

logger = logging.getLogger(__name__)


def _docker_client() -> docker.DockerClient:
    settings = get_settings()
    return docker.DockerClient(base_url=settings.docker_socket)


def _ensure_base_image() -> None:
    """Build the base agent image if it doesn't exist locally.

    Looks for the agent/ directory (sibling of backend/) containing
    Dockerfile.base and its dependencies. Builds nenyax-agent-base:latest.
    """
    settings = get_settings()
    base_tag = settings.base_agent_image

    client = _docker_client()
    try:
        client.images.get(base_tag)
        logger.debug(f"Base image {base_tag} already exists")
        return
    except docker.errors.ImageNotFound:
        pass

    # Find the agent/ directory — sibling of backend/
    # backend/ is at <project>/backend, agent/ is at <project>/agent
    backend_dir = Path(__file__).resolve().parent.parent.parent  # backend/
    agent_dir = backend_dir.parent / "agent"

    if not (agent_dir / "Dockerfile.base").exists():
        raise RuntimeError(
            f"Base image '{base_tag}' not found and cannot auto-build: "
            f"Dockerfile.base not found at {agent_dir / 'Dockerfile.base'}. "
            f"Build it manually: cd agent && docker build -f Dockerfile.base -t {base_tag} ."
        )

    logger.info(f"Base image '{base_tag}' not found — auto-building from {agent_dir}")
    try:
        image, build_logs = client.images.build(
            path=str(agent_dir),
            dockerfile="Dockerfile.base",
            tag=base_tag,
            rm=True,
        )
        for log_entry in build_logs:
            if "stream" in log_entry:
                line = log_entry["stream"].strip()
                if line:
                    logger.info(f"[base-build] {line}")
        logger.info(f"Base image '{base_tag}' built successfully")
    except Exception as exc:
        raise RuntimeError(
            f"Failed to auto-build base image '{base_tag}': {exc}. "
            f"Build it manually: cd agent && docker build -f Dockerfile.base -t {base_tag} ."
        ) from exc


def should_rebuild(agent_id: str, db: Session) -> bool:
    """Return True when requirements.txt has changed since the last build."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent or not agent.image_tag:
        return True

    try:
        content = minio_client.download_file(agent_id, "requirements.txt")
        current_hash = hashlib.sha256(content).hexdigest()
    except Exception:
        return False

    # Compare with stored hash in the image tag
    # Tag format: nenyax-custom-{agent_id}:{hash_prefix}
    tag_parts = agent.image_tag.split(":")
    if len(tag_parts) < 2:
        return True
    return not tag_parts[1].startswith(current_hash[:12])


def build_custom_image(agent_id: str, db: Session) -> str:
    """Build a Docker image for a custom agent.

    Generates a Dockerfile that extends the base image, installs custom
    requirements, and copies agent files. Returns the image tag.
    """
    settings = get_settings()
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise ValueError(f"Agent {agent_id} not found")

    # Ensure the base image exists — auto-build if missing
    _ensure_base_image()

    agent.build_status = AgentBuildStatus.BUILDING
    agent.build_error = None
    db.commit()

    try:
        # Download requirements.txt to determine tag
        try:
            req_content = minio_client.download_file(agent_id, "requirements.txt")
            req_hash = hashlib.sha256(req_content).hexdigest()[:12]
        except Exception:
            req_hash = "base"

        image_tag = f"nenyax-custom-{agent_id}:{req_hash}"

        # Build a minimal Dockerfile
        dockerfile = (
            f"FROM {settings.base_agent_image}\n"
            "COPY requirements.txt /app/requirements.txt\n"
            "RUN pip install --no-cache-dir -r /app/requirements.txt 2>/dev/null || true\n"
            "COPY . /app/\n"
        )

        client = _docker_client()
        import io, tarfile

        # Create a build context tarball
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode="w") as tar:
            # Add Dockerfile
            df_bytes = dockerfile.encode()
            df_info = tarfile.TarInfo(name="Dockerfile")
            df_info.size = len(df_bytes)
            tar.addfile(df_info, io.BytesIO(df_bytes))

            # Add all agent files from MinIO
            file_paths = minio_client.list_files(agent_id)
            for fp in file_paths:
                try:
                    content = minio_client.download_file(agent_id, fp)
                    info = tarfile.TarInfo(name=fp)
                    info.size = len(content)
                    tar.addfile(info, io.BytesIO(content))
                except Exception:
                    logger.warning("Skipping file %s during build", fp)

        buf.seek(0)
        client.images.build(fileobj=buf, custom_context=True, tag=image_tag, rm=True)

        agent.image_tag = image_tag
        agent.build_status = AgentBuildStatus.READY
        agent.last_build_at = datetime.utcnow()
        db.commit()
        return image_tag

    except Exception as exc:
        agent.build_status = AgentBuildStatus.FAILED
        agent.build_error = str(exc)[:2000]
        db.commit()
        raise


def get_image_for_agent(agent_id: str, db: Session) -> str:
    """Return the Docker image tag to use for this agent."""
    settings = get_settings()
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if agent and agent.image_tag and agent.build_status == AgentBuildStatus.READY:
        return agent.image_tag
    return settings.base_agent_image
