from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import agents, sessions, livekit, telephony, resemble, calls, usage, costs
from app.routers import agent_files, containers, coding_agent

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "arkenos-api"}


@app.get("/")
async def root():
    return {"message": "Welcome to Arkenos API", "docs": "/docs"}
