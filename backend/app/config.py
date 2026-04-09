from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────
    postgres_password: str = "nenyax"
    database_url: str = ""
    db_host: str = "localhost"
    db_port: int = 5434  # docker-compose maps 5434→5432; overridden to 5432 inside Docker

    # ── LiveKit ───────────────────────────────────────────────────────
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""
    livekit_sip_uri: str = ""
    livekit_sip_trunk_id: str = ""

    # ── Voice / Telephony providers ───────────────────────────────────
    resemble_api_key: str = ""
    resemble_voice_uuid: str = ""
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_sip_domain: str = ""
    telnyx_api_key: str = ""

    # ── MinIO (object storage for custom agent files) ─────────────────
    minio_endpoint: str = "localhost:9002"  # docker-compose maps 9002→9000
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "nenyax"
    minio_use_ssl: bool = False

    # ── Docker / Custom Agents ────────────────────────────────────────
    container_backend_url: str = "http://host.docker.internal:8000/api"
    docker_socket: str = "unix:///var/run/docker.sock"
    base_agent_image: str = "nenyax-agent-base:latest"
    container_network: str = "nenyax_default"
    container_timeout_seconds: int = 3600

    # ── STT provider keys (passed to custom agent containers) ─────────
    assemblyai_api_key: str = ""
    deepgram_api_key: str = ""

    # ── Coding Agent ──────────────────────────────────────────────────
    coding_agent_provider: str = "gemini"
    google_api_key: str = ""

    # ── Server ────────────────────────────────────────────────────────
    port: int = 8000
    debug: bool = True
    frontend_url: str = "http://localhost:3000"  # CORS — comma-separated for multiple origins

    @property
    def cors_origins(self) -> list[str]:
        """Parse frontend_url into a list of allowed origins."""
        return [u.strip() for u in self.frontend_url.split(",") if u.strip()]

    @model_validator(mode="after")
    def build_database_url(self):
        if not self.database_url:
            self.database_url = f"postgresql://postgres:{self.postgres_password}@{self.db_host}:{self.db_port}/nenyax"
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
