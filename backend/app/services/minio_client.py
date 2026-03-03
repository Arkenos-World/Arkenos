from io import BytesIO
from minio import Minio
from app.config import get_settings

_client: Minio | None = None


def get_client() -> Minio:
    """Return a cached MinIO client instance."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_use_ssl,
        )
    return _client


def ensure_bucket() -> None:
    """Create the default bucket if it doesn't exist."""
    client = get_client()
    bucket = get_settings().minio_bucket
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def _agent_key(agent_id: str, file_path: str) -> str:
    return f"agents/{agent_id}/{file_path}"


def upload_file(agent_id: str, file_path: str, content: bytes) -> str:
    """Upload a file for an agent. Returns the object key."""
    client = get_client()
    bucket = get_settings().minio_bucket
    key = _agent_key(agent_id, file_path)
    client.put_object(bucket, key, BytesIO(content), len(content))
    return key


def download_file(agent_id: str, file_path: str) -> bytes:
    """Download a file for an agent."""
    client = get_client()
    bucket = get_settings().minio_bucket
    key = _agent_key(agent_id, file_path)
    response = client.get_object(bucket, key)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()


def list_files(agent_id: str) -> list[str]:
    """List all file paths for an agent."""
    client = get_client()
    bucket = get_settings().minio_bucket
    prefix = f"agents/{agent_id}/"
    objects = client.list_objects(bucket, prefix=prefix, recursive=True)
    return [obj.object_name.removeprefix(prefix) for obj in objects]


def delete_file(agent_id: str, file_path: str) -> None:
    """Delete a file for an agent."""
    client = get_client()
    bucket = get_settings().minio_bucket
    key = _agent_key(agent_id, file_path)
    client.remove_object(bucket, key)


def upload_version(agent_id: str, file_path: str, version: int, content: bytes) -> str:
    """Upload a versioned copy of a file. Returns the object key."""
    client = get_client()
    bucket = get_settings().minio_bucket
    key = f"agents/{agent_id}/.versions/{file_path}/v{version}"
    client.put_object(bucket, key, BytesIO(content), len(content))
    return key
