"""Shared FastAPI dependencies for auth and ownership checks.

Authentication priority:
  1. Authorization: Bearer <session_token> — verified against Better Auth session table
  2. X-User-Id header — trusted for server-to-server calls (agent worker, internal)
"""

import logging
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.database import get_db
from app.models import Agent, User
from app.services.config_resolver import _current_user_id

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Session token verification
# ---------------------------------------------------------------------------


def verify_session_token(db: Session, token: str) -> Optional[User]:
    """Verify a Better Auth session token against the session table.

    Single indexed query — sub-millisecond. Returns the backend User or None.
    """
    result = db.execute(
        text(
            'SELECT "userId" FROM "session" '
            'WHERE token = :token AND "expiresAt" > :now'
        ),
        {"token": token, "now": datetime.now(timezone.utc)},
    ).fetchone()
    if not result:
        return None
    auth_user_id = result[0]
    return db.query(User).filter(User.auth_id == auth_user_id).first()


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------


def _resolve_user(
    db: Session,
    authorization: Optional[str] = None,
    x_user_id: Optional[str] = None,
) -> Optional[User]:
    """Resolve user from auth headers. Returns User or None."""
    # 1. Try Bearer session token (Better Auth)
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        user = verify_session_token(db, token)
        if user:
            return user
        # Token was provided but invalid — don't fall through to x-user-id
        return None

    # 2. Fallback: x-user-id header (server-to-server only)
    if x_user_id:
        return db.query(User).filter(User.auth_id == x_user_id).first()

    return None


def get_current_user(
    request: Request,
    x_user_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user.

    Checks in order:
      0. request.state.user — already resolved by middleware
      1. Authorization: Bearer <jwt> — verified via JWKS
      2. X-User-Id header — fallback for server-to-server (agent worker)
    """
    # Middleware may have already resolved the user
    user = getattr(request.state, "user", None)
    if not user:
        user = _resolve_user(db, authorization, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    _current_user_id.set(user.id)
    return user


def verify_agent_ownership(
    request: Request,
    agent_id: str = Path(...),
    x_user_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Agent:
    """Verify the authenticated user owns the specified agent."""
    user = _resolve_user(db, authorization, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    _current_user_id.set(user.id)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.user_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this agent")

    return agent
