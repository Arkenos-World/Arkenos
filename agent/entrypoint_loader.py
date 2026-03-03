"""
Arkenos Custom Agent Entrypoint Loader

Downloads user-authored agent files from MinIO, installs any extra
requirements, then imports and runs the custom agent via LiveKit's CLI.

Expected environment variables:
    AGENT_ID            - UUID of the custom agent
    MINIO_ENDPOINT      - MinIO host:port (e.g. minio:9000)
    MINIO_ACCESS_KEY    - MinIO access key
    MINIO_SECRET_KEY    - MinIO secret key
    MINIO_BUCKET        - Bucket name (default: agent-code)
    BACKEND_API_URL     - Backend API base URL
    LIVEKIT_URL         - LiveKit server URL
    LIVEKIT_API_KEY     - LiveKit API key
    LIVEKIT_API_SECRET  - LiveKit API secret
"""

import importlib
import logging
import os
import subprocess
import sys

from minio import Minio
from minio.error import S3Error

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("entrypoint-loader")

WORKSPACE_DIR = "/app/workspace"
LIB_DIR = "/app/lib"


def get_required_env(name: str) -> str:
    """Read a required environment variable or exit."""
    value = os.environ.get(name)
    if not value:
        logger.error(f"Missing required environment variable: {name}")
        sys.exit(1)
    return value


def build_minio_client() -> Minio:
    """Create a MinIO client from environment variables."""
    endpoint = get_required_env("MINIO_ENDPOINT")
    access_key = get_required_env("MINIO_ACCESS_KEY")
    secret_key = get_required_env("MINIO_SECRET_KEY")
    secure = os.environ.get("MINIO_SECURE", "false").lower() == "true"

    logger.info(f"Connecting to MinIO at {endpoint} (secure={secure})")
    return Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)


def download_agent_files(client: Minio, bucket: str, agent_id: str) -> None:
    """Download all files for the given agent from MinIO into /app/workspace/."""
    prefix = f"agents/{agent_id}/"
    logger.info(f"Downloading agent files from s3://{bucket}/{prefix}")

    objects = list(client.list_objects(bucket, prefix=prefix, recursive=True))
    if not objects:
        logger.error(f"No files found in s3://{bucket}/{prefix}")
        sys.exit(1)

    for obj in objects:
        # Strip the prefix to get the relative path inside workspace
        relative_path = obj.object_name[len(prefix):]
        if not relative_path:
            continue

        local_path = os.path.join(WORKSPACE_DIR, relative_path)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        logger.info(f"  Downloading {obj.object_name} -> {local_path}")
        client.fget_object(bucket, obj.object_name, local_path)

    logger.info(f"Downloaded {len(objects)} file(s) to {WORKSPACE_DIR}")


def install_extra_requirements() -> None:
    """If the workspace contains a requirements.txt, pip-install it."""
    req_path = os.path.join(WORKSPACE_DIR, "requirements.txt")
    if not os.path.exists(req_path):
        logger.info("No requirements.txt found in workspace, skipping extra install")
        return

    logger.info(f"Installing extra requirements from {req_path}")
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--no-cache-dir", "-r", req_path],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error(f"pip install failed:\n{result.stderr}")
        sys.exit(1)
    logger.info("Extra requirements installed successfully")


def setup_python_path() -> None:
    """Add workspace and lib dirs to sys.path AND PYTHONPATH.

    PYTHONPATH must be set so that child processes spawned by the LiveKit
    agents forkserver can re-import the custom agent module by name.
    """
    for d in (WORKSPACE_DIR, LIB_DIR):
        if d not in sys.path:
            sys.path.insert(0, d)

    # Set PYTHONPATH for child processes (forkserver)
    existing = os.environ.get("PYTHONPATH", "")
    paths = [p for p in existing.split(":") if p]
    for d in (WORKSPACE_DIR, LIB_DIR):
        if d not in paths:
            paths.insert(0, d)
    os.environ["PYTHONPATH"] = ":".join(paths)


def load_custom_agent():
    """Import workspace/agent.py and return the AgentServer instance.

    Looks for a module-level `server` variable first (preferred pattern).
    Falls back to calling `create_agent()` if `server` is not found.

    We import as `agent` (matching the filename) so the forkserver child
    process can re-import it by that same name.
    """
    agent_path = os.path.join(WORKSPACE_DIR, "agent.py")
    if not os.path.exists(agent_path):
        logger.error(f"Custom agent file not found: {agent_path}")
        sys.exit(1)

    logger.info(f"Loading custom agent from {agent_path}")

    # Import as "agent" — matching the filename so forkserver can re-import
    import agent as custom_module

    # Look for a module-level `server` variable (preferred)
    server = getattr(custom_module, "server", None)
    if server is not None:
        logger.info("Found module-level `server` variable")
        return server

    # Fallback: call create_agent() if defined
    create_fn = getattr(custom_module, "create_agent", None)
    if callable(create_fn):
        logger.info("Found `create_agent()` function, calling it")
        server = create_fn()
        # Stash on module so forkserver child can find it on re-import
        custom_module.server = server
        return server

    logger.error("custom agent module must define a `server` variable or `create_agent()` function")
    sys.exit(1)


def main() -> None:
    logger.info("=== Arkenos Custom Agent Entrypoint ===")

    agent_id = get_required_env("AGENT_ID")
    bucket = os.environ.get("MINIO_BUCKET", "agent-code")

    # Step 1: Download agent files from MinIO
    try:
        minio_client = build_minio_client()
        download_agent_files(minio_client, bucket, agent_id)
    except S3Error as e:
        logger.error(f"MinIO error downloading agent files: {e}")
        sys.exit(1)

    # Step 2: Install extra requirements if present
    install_extra_requirements()

    # Step 3: Set up PYTHONPATH for workspace and lib dirs
    # This MUST happen before importing the agent module or livekit.agents
    # so forkserver child processes inherit the paths.
    setup_python_path()

    # Step 4: Load the custom agent module and get the AgentServer
    server = load_custom_agent()

    # Step 5: Run the agent via LiveKit CLI
    room_name = os.environ.get("ROOM_NAME")
    if room_name:
        # Connect to a specific room (preview / call mode)
        logger.info(f"Starting custom agent {agent_id} — connecting to room: {room_name}")
        sys.argv = ["agent", "connect", "--room", room_name]
    else:
        # No room specified — start as a generic worker (dispatch mode)
        logger.info(f"Starting custom agent {agent_id} in worker mode")
        sys.argv = ["agent", "start"]

    from livekit import agents
    agents.cli.run_app(server)


if __name__ == "__main__":
    main()
