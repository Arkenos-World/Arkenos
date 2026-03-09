"""Shared FastAPI dependencies for auth and ownership checks."""

from fastapi import Depends, Header, HTTPException, Path
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Agent, User


def get_current_user(
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from the X-User-Id header (auth provider ID)."""
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = db.query(User).filter(User.auth_id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def verify_agent_ownership(
    agent_id: str = Path(...),
    x_user_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Agent:
    """Verify the authenticated user owns the specified agent.

    Returns the Agent if authorized; raises 401/403/404 otherwise.
    Use this as a dependency in any route that takes agent_id.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = db.query(User).filter(User.auth_id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this agent")

    return agent
