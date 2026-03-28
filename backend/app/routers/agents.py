import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Agent, AgentMode, Organization, User
from app.schemas import AgentCreate, AgentUpdate, AgentResponse
from app.services.scaffold_templates import scaffold_agent
from app.dependencies import verify_agent_ownership, get_current_user, get_current_org

logger = logging.getLogger(__name__)

router = APIRouter()



@router.get("/", response_model=list[AgentResponse])
async def get_agents(
    user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """Get all agents for the authenticated user's organization."""
    agents = db.query(Agent).filter(Agent.org_id == org.id, Agent.is_active == True).order_by(Agent.created_at.desc()).all()
    return agents


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get a single agent by ID."""
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(
    agent_data: AgentCreate,
    user: User = Depends(get_current_user),
    org: Organization = Depends(get_current_org),
    db: Session = Depends(get_db),
):
    """Create a new agent."""
    agent_id = str(uuid.uuid4())
    mode = AgentMode(agent_data.agent_mode) if agent_data.agent_mode else AgentMode.STANDARD

    agent = Agent(
        id=agent_id,
        name=agent_data.name,
        description=agent_data.description,
        type=agent_data.type,
        config=agent_data.config,
        user_id=user.id,
        org_id=org.id,
        agent_mode=mode,
    )

    if mode == AgentMode.CUSTOM:
        agent.storage_path = f"agents/{agent_id}"

    db.add(agent)
    db.commit()
    db.refresh(agent)

    # Scaffold default files for custom agents
    if mode == AgentMode.CUSTOM:
        try:
            scaffold_agent(agent_id, db)
        except Exception as e:
            logger.error(f"Failed to scaffold custom agent {agent_id}: {e}")

    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Update an agent."""
    
    update_data = agent_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)
    
    db.commit()
    db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    db: Session = Depends(get_db),
    agent: Agent = Depends(verify_agent_ownership),
):
    """Soft delete an agent (sets is_active to False). Releases phone number if assigned."""

    # Release phone number if assigned
    if agent.phone_number:
        # 1. Remove from LiveKit inbound trunk
        try:
            from app.services.telephony_provisioning import remove_number_from_inbound_trunk
            await remove_number_from_inbound_trunk(agent.phone_number)
        except Exception as e:
            logger.warning(f"Failed to remove number from LiveKit trunk on delete: {e}")

        # 2. Clean up provider-side config (Twilio trunk_sid / Telnyx connection_id)
        if agent.provider_number_sid:
            try:
                from app.services.telephony_providers import get_provider
                provider_name = agent.telephony_provider or "twilio"
                provider_impl = get_provider(provider_name, db)
                await provider_impl.disassociate_number_from_sip(agent.provider_number_sid)
            except Exception as e:
                logger.warning(f"Failed to clean up {agent.telephony_provider} config on delete: {e}")

        agent.phone_number = None
        agent.provider_number_sid = None
        agent.telephony_provider = None

    agent.is_active = False
    db.commit()
    return None
