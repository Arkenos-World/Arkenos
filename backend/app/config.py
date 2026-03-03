from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    postgres_password: str = ""
    database_url: str = ""
    db_host: str = "localhost"

    # LiveKit
    livekit_api_key: str = ""
    livekit_api_secret: str = ""
    livekit_url: str = ""

    # Resemble AI
    resemble_api_key: str = ""
    resemble_voice_uuid: str = ""

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_sip_domain: str = ""  # e.g. arkenos.sip.livekit.cloud

    # LiveKit SIP
    livekit_sip_trunk_id: str = ""  # Outbound SIP trunk ID for call transfers

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "arkenos"
    minio_use_ssl: bool = False

    # Docker / Custom Agents
    docker_socket: str = "unix:///var/run/docker.sock"
    base_agent_image: str = "arkenos-agent-base:latest"
    container_network: str = "arkenos_default"
    container_timeout_seconds: int = 3600

    # STT provider keys (passed to custom agent containers)
    assemblyai_api_key: str = ""
    deepgram_api_key: str = ""

    # Coding Agent
    coding_agent_provider: str = "gemini"
    google_api_key: str = ""

    # Server
    port: int = 8000
    debug: bool = True

    # CORS — comma-separated origins, e.g. "http://localhost:3000,https://arkenos.onrender.com"
    frontend_url: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse frontend_url into a list of allowed origins."""
        return [u.strip() for u in self.frontend_url.split(",") if u.strip()]

    @model_validator(mode="after")
    def build_database_url(self):
        if not self.database_url:
            self.database_url = f"postgresql://postgres:{self.postgres_password}@{self.db_host}:5432/arkenos"
        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
