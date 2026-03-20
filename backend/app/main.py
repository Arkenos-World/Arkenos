import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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


class UserContextMiddleware(BaseHTTPMiddleware):
    """Set user and org context for key resolution and resource scoping.

    Resolves user from: Bearer token → x-user-id header
    Resolves org from: x-org-id header → session's activeOrganizationId → user's first org
    """
    async def dispatch(self, request: Request, call_next):
        from app.services.config_resolver import _current_user_id, _current_org_id
        from app.database import SessionLocal
        from app.models import User, Organization, OrgMember

        user = None
        db = SessionLocal()
        try:
            # Resolve user
            auth_header = request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                from app.dependencies import verify_session_token
                user = verify_session_token(db, auth_header[7:])

            if not user:
                auth_id = request.headers.get("x-user-id")
                if auth_id:
                    user = db.query(User).filter(User.auth_id == auth_id).first()

            if user:
                _current_user_id.set(user.id)
                request.state.user = user

                # Resolve org
                org = None
                ba_org_id_to_resolve = None
                x_org_id = request.headers.get("x-org-id")
                if x_org_id:
                    org = db.query(Organization).filter(Organization.ba_org_id == x_org_id).first()
                    if not org:
                        org = db.query(Organization).filter(Organization.id == x_org_id).first()
                    if not org:
                        ba_org_id_to_resolve = x_org_id

                # From session's activeOrganizationId
                if not org and auth_header.startswith("Bearer "):
                    from app.dependencies import get_active_org_from_session
                    ba_org_id = get_active_org_from_session(db, auth_header[7:])
                    if ba_org_id:
                        org = db.query(Organization).filter(Organization.ba_org_id == ba_org_id).first()
                        if not org:
                            ba_org_id_to_resolve = ba_org_id

                # Auto-create Arkenos org from Better Auth org if not found
                if not org and ba_org_id_to_resolve:
                    from app.dependencies import _auto_create_org_from_ba
                    org = _auto_create_org_from_ba(db, ba_org_id_to_resolve, user)

                # Fallback: user's first org
                if not org:
                    membership = db.query(OrgMember).filter(OrgMember.user_id == user.id).first()
                    if membership:
                        org = db.query(Organization).filter(Organization.id == membership.org_id).first()

                if org:
                    # Verify membership
                    member = db.query(OrgMember).filter(
                        OrgMember.org_id == org.id, OrgMember.user_id == user.id
                    ).first()
                    if member:
                        _current_org_id.set(org.id)
                        request.state.org = org
                        request.state.org_role = member.role
        finally:
            db.close()

        response = await call_next(request)
        _current_user_id.set(None)
        _current_org_id.set(None)
        return response


app.add_middleware(UserContextMiddleware)

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
    logger.error(f"Failed to run migrations: {e}", exc_info=True)
    raise


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


def _ensure_minio_bucket():
    """Ensure the MinIO bucket exists on startup."""
    from app.services.minio_client import ensure_bucket
    ensure_bucket()
    logger.info("MinIO bucket ensured")


try:
    _ensure_minio_bucket()
except Exception as e:
    logger.error(f"Failed to ensure MinIO bucket: {e}")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "arkenos-api"}


@app.get("/")
async def root():
    return {"message": "Welcome to Arkenos API", "docs": "/docs"}
