"""Shared FastAPI dependencies for auth and ownership checks.

Authentication priority:
  1. Authorization: Bearer <session_token> — verified against Better Auth session table
  2. X-User-Id header — trusted for server-to-server calls (agent worker, internal)

Organization resolution:
  1. x-org-id header — Better Auth org ID or internal org ID
  2. Session's activeOrganizationId (via middleware)
"""

import logging
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.database import get_db
from app.models import Agent, Organization, OrgMember, User
from app.services.config_resolver import _current_user_id, _current_org_id

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Session token verification
# ---------------------------------------------------------------------------


def verify_session_token(db: Session, token: str) -> Optional[User]:
    """Verify a Better Auth session token against the session table.

    Single indexed query — sub-millisecond. Returns the backend User or None.
    Auto-creates a backend User record if a valid BA session exists but no
    backend user is found yet (first login after Better Auth signup).
    """
    import uuid

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

    user = db.query(User).filter(User.auth_id == auth_user_id).first()
    if user:
        return user

    # Auto-create backend User from Better Auth user table
    ba_user = db.execute(
        text('SELECT id, name, email FROM "user" WHERE id = :id'),
        {"id": auth_user_id},
    ).fetchone()
    if not ba_user:
        return None

    user = User(
        id=str(uuid.uuid4()),
        auth_id=ba_user[0],
        name=ba_user[1],
        email=ba_user[2],
    )
    db.add(user)
    try:
        db.commit()
        logger.info(f"Auto-created backend user {user.id} from BA user {auth_user_id}")
    except Exception:
        db.rollback()
        # May have been created concurrently — try to fetch again
        user = db.query(User).filter(User.auth_id == auth_user_id).first()

    return user


def get_active_org_from_session(db: Session, token: str) -> Optional[str]:
    """Get activeOrganizationId from the Better Auth session."""
    result = db.execute(
        text(
            'SELECT "activeOrganizationId" FROM "session" '
            'WHERE token = :token AND "expiresAt" > :now'
        ),
        {"token": token, "now": datetime.now(timezone.utc)},
    ).fetchone()
    if result and result[0]:
        return result[0]
    return None


# ---------------------------------------------------------------------------
# User resolution
# ---------------------------------------------------------------------------


def _resolve_user(
    db: Session,
    authorization: Optional[str] = None,
    x_user_id: Optional[str] = None,
) -> Optional[User]:
    """Resolve user from auth headers. Returns User or None."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        user = verify_session_token(db, token)
        if user:
            return user
        return None

    if x_user_id:
        return db.query(User).filter(User.auth_id == x_user_id).first()

    return None


def get_current_user(
    request: Request,
    x_user_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user."""
    user = getattr(request.state, "user", None)
    if not user:
        user = _resolve_user(db, authorization, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    _current_user_id.set(user.id)
    return user


# ---------------------------------------------------------------------------
# Organization resolution
# ---------------------------------------------------------------------------


def _auto_create_org_from_ba(
    db: Session,
    ba_org_id: str,
    user: User,
) -> Optional[Organization]:
    """Auto-create a Nenyax Organization record from a Better Auth org.

    Queries the Better Auth `organization` table for the name/slug, creates the
    Nenyax Organization row, and adds an owner membership for the given user.
    Returns the new Organization or None if the BA org doesn't exist.
    """
    import uuid

    ba_org = db.execute(
        text('SELECT id, name, slug FROM "organization" WHERE id = :id'),
        {"id": ba_org_id},
    ).fetchone()
    if not ba_org:
        return None

    org = Organization(
        id=str(uuid.uuid4()),
        ba_org_id=ba_org[0],
        name=ba_org[1],
        slug=ba_org[2] or f"org-{ba_org[0][:8]}",
    )
    db.add(org)

    member = OrgMember(
        id=str(uuid.uuid4()),
        org_id=org.id,
        user_id=user.id,
        role="owner",
    )
    db.add(member)

    try:
        db.commit()
        logger.info(f"Auto-created Nenyax org {org.id} from BA org {ba_org_id}")
    except Exception:
        db.rollback()
        # May have been created concurrently — try to fetch again
        org = db.query(Organization).filter(Organization.ba_org_id == ba_org_id).first()

    return org


def _resolve_org(
    db: Session,
    user: User,
    x_org_id: Optional[str] = None,
    authorization: Optional[str] = None,
) -> Optional[Organization]:
    """Resolve organization and verify user membership.

    Checks:
      1. x-org-id header (Better Auth org ID or internal org ID)
      2. activeOrganizationId from session
      3. User's first org (fallback for single-org users)
    """
    org = None
    ba_org_id_to_resolve = None

    # 1. Explicit org ID from header
    if x_org_id:
        org = db.query(Organization).filter(Organization.ba_org_id == x_org_id).first()
        if not org:
            org = db.query(Organization).filter(Organization.id == x_org_id).first()
        if not org:
            ba_org_id_to_resolve = x_org_id

    # 2. From session's activeOrganizationId
    if not org and authorization and authorization.startswith("Bearer "):
        ba_org_id = get_active_org_from_session(db, authorization[7:])
        if ba_org_id:
            org = db.query(Organization).filter(Organization.ba_org_id == ba_org_id).first()
            if not org:
                ba_org_id_to_resolve = ba_org_id

    # Auto-create Nenyax org from Better Auth org if not found
    if not org and ba_org_id_to_resolve:
        org = _auto_create_org_from_ba(db, ba_org_id_to_resolve, user)

    # 3. Fallback: user's first org (for single-org users / backward compat)
    if not org:
        membership = db.query(OrgMember).filter(OrgMember.user_id == user.id).first()
        if membership:
            org = db.query(Organization).filter(Organization.id == membership.org_id).first()

    # Verify membership
    if org:
        member = db.query(OrgMember).filter(
            OrgMember.org_id == org.id,
            OrgMember.user_id == user.id,
        ).first()
        if not member:
            return None

    return org


def get_current_org(
    request: Request,
    x_org_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    """Resolve the active organization for the current user."""
    org = getattr(request.state, "org", None)
    if not org:
        org = _resolve_org(db, user, x_org_id, authorization)
    if not org:
        raise HTTPException(status_code=400, detail="No active organization. Create one first.")
    _current_org_id.set(org.id)
    request.state.org = org
    # Store role for require_role checks
    member = db.query(OrgMember).filter(
        OrgMember.org_id == org.id, OrgMember.user_id == user.id
    ).first()
    request.state.org_role = member.role if member else None
    return org


def require_role(*roles: str):
    """FastAPI dependency that checks the user has one of the required roles."""
    def checker(request: Request):
        role = getattr(request.state, "org_role", None)
        if role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"This action requires one of these roles: {', '.join(roles)}"
            )
    return checker


# ---------------------------------------------------------------------------
# Agent ownership (org-aware)
# ---------------------------------------------------------------------------


def verify_agent_ownership(
    request: Request,
    agent_id: str = Path(...),
    x_user_id: Optional[str] = Header(None),
    x_org_id: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Agent:
    """Verify the agent belongs to the user's active organization."""
    user = getattr(request.state, "user", None)
    if not user:
        user = _resolve_user(db, authorization, x_user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    _current_user_id.set(user.id)

    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # If agent has org_id, verify user is a member of that org
    if agent.org_id:
        member = db.query(OrgMember).filter(
            OrgMember.org_id == agent.org_id,
            OrgMember.user_id == user.id,
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="You don't have access to this agent")
        _current_org_id.set(agent.org_id)
    else:
        # Legacy: no org_id, fall back to user ownership check
        if agent.user_id != user.id:
            raise HTTPException(status_code=403, detail="You do not own this agent")

    return agent
