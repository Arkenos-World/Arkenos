import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import agents, sessions, livekit, telephony, resemble, calls, usage, costs
from app.routers import agent_files, containers, coding_agent
from app.routers import settings as settings_router

logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="Arkenos API",
    description="Backend API for Arkenos — Composable orchestration for conversational AI",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(livekit.router, prefix="/api/livekit", tags=["LiveKit"])
app.include_router(telephony.router, prefix="/api/telephony", tags=["Telephony"])
app.include_router(resemble.router, prefix="/api/resemble", tags=["Resemble"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls"])
app.include_router(usage.router, prefix="/api/usage", tags=["Usage"])
app.include_router(costs.router, prefix="/api/costs", tags=["Costs"])
app.include_router(agent_files.router, prefix="/api/agents/{agent_id}/files", tags=["Agent Files"])
app.include_router(containers.router, prefix="/api/agents/{agent_id}/containers", tags=["Containers"])
app.include_router(coding_agent.router, prefix="/api/agents/{agent_id}/coding-agent", tags=["Coding Agent"])
app.include_router(settings_router.router, prefix="/api/settings", tags=["Settings"])



def _run_migrations():
    """Auto-run Alembic migrations on startup. Safe to run repeatedly."""
    import os
    from alembic.config import Config
    from alembic import command

    # Resolve alembic.ini relative to backend/ directory
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ini_path = os.path.join(backend_dir, "alembic.ini")
    alembic_cfg = Config(ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    command.upgrade(alembic_cfg, "head")
    logger.info("Database migrations applied successfully")


try:
    _run_migrations()
except Exception as e:
    logger.error(f"Failed to run migrations: {e}")


def _ensure_instance_id():
    """Generate and store a unique instance ID on first boot."""
    import uuid
    from app.database import SessionLocal
    from app.models import InstanceSettings

    db = SessionLocal()
    try:
        row = db.query(InstanceSettings).filter(InstanceSettings.key == "instance_id").first()
        if not row:
            row = InstanceSettings(key="instance_id", encrypted_value=str(uuid.uuid4()))
            db.add(row)
            db.commit()
            logger.info(f"Generated instance ID: {row.encrypted_value}")
        else:
            logger.info(f"Instance ID: {row.encrypted_value}")
    except Exception as e:
        logger.error(f"Failed to ensure instance ID: {e}")
        db.rollback()
    finally:
        db.close()


_ensure_instance_id()


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "arkenos-api"}


@app.get("/")
async def root():
    return {"message": "Welcome to Arkenos API", "docs": "/docs"}
