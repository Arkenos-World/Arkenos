"""Add multi-tenancy: organizations, org_members, org_api_keys, org_id columns

Revision ID: 20260318_add_multi_tenancy
Revises: 20260317_add_user_api_keys
Create Date: 2026-03-18 00:00:00.000000
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = '20260318_add_multi_tenancy'
down_revision: Union[str, None] = '20260317_add_user_api_keys'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Phase 1: Create new tables ---

    op.create_table(
        'organizations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('ba_org_id', sa.String(255), unique=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False),
        sa.Column('plan', sa.String(50), server_default='free'),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('usage_limit_minutes', sa.Integer(), server_default='100'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_organizations_ba_org_id', 'organizations', ['ba_org_id'])

    op.create_table(
        'org_members',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('org_id', sa.String(36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), server_default='member', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('org_id', 'user_id', name='uq_org_members_org_user'),
    )
    op.create_index('ix_org_members_org_id', 'org_members', ['org_id'])
    op.create_index('ix_org_members_user_id', 'org_members', ['user_id'])

    op.create_table(
        'org_api_keys',
        sa.Column('org_id', sa.String(36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('key_name', sa.String(100), primary_key=True),
        sa.Column('encrypted_value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # --- Phase 2: Add nullable org_id columns to existing tables ---

    op.add_column('agents', sa.Column('org_id', sa.String(36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True))
    op.create_index('ix_agents_org_id', 'agents', ['org_id'])

    op.add_column('voice_sessions', sa.Column('org_id', sa.String(36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True))
    op.create_index('ix_voice_sessions_org_id', 'voice_sessions', ['org_id'])

    op.add_column('usage_events', sa.Column('org_id', sa.String(36), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True))
    op.create_index('ix_usage_events_org_id', 'usage_events', ['org_id'])

    # Add activeOrganizationId to Better Auth session table (may not exist on fresh DB)
    conn = op.get_bind()
    try:
        result = conn.execute(sa.text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session')"
        ))
        session_table_exists = result.scalar()
        if session_table_exists:
            try:
                op.add_column('session', sa.Column('activeOrganizationId', sa.Text(), nullable=True))
            except Exception:
                pass  # Column may already exist from Better Auth auto-migration
    except Exception:
        pass  # Fresh DB, no session table yet

    # --- Phase 3: Backfill — create personal org for each existing user ---

    # Check if users table has any rows (fresh DB will have none)
    try:
        users = conn.execute(sa.text('SELECT id, name, email FROM users')).fetchall()
    except Exception:
        users = []  # Fresh DB — no users to backfill

    for user in users:
        org_id = str(uuid.uuid4())
        ba_org_id = f"personal_{user[0]}"
        user_name = user[1] or user[2] or "User"
        slug = f"personal-{user[0][:8]}"

        # Create org
        conn.execute(sa.text(
            'INSERT INTO organizations (id, ba_org_id, name, slug) VALUES (:id, :ba_org_id, :name, :slug)'
        ), {"id": org_id, "ba_org_id": ba_org_id, "name": f"{user_name}'s Organization", "slug": slug})

        # Create membership (owner)
        conn.execute(sa.text(
            'INSERT INTO org_members (id, org_id, user_id, role) VALUES (:id, :org_id, :user_id, :role)'
        ), {"id": str(uuid.uuid4()), "org_id": org_id, "user_id": user[0], "role": "owner"})

        # Update agents
        conn.execute(sa.text(
            'UPDATE agents SET org_id = :org_id WHERE user_id = :user_id'
        ), {"org_id": org_id, "user_id": user[0]})

        # Update voice_sessions
        conn.execute(sa.text(
            'UPDATE voice_sessions SET org_id = :org_id WHERE user_id = :user_id'
        ), {"org_id": org_id, "user_id": user[0]})

        # Update usage_events
        conn.execute(sa.text(
            'UPDATE usage_events SET org_id = :org_id WHERE user_id = :user_id'
        ), {"org_id": org_id, "user_id": user[0]})

        # Copy user_api_keys to org_api_keys
        user_keys = conn.execute(sa.text(
            'SELECT key_name, encrypted_value FROM user_api_keys WHERE user_id = :user_id'
        ), {"user_id": user[0]}).fetchall()

        for key in user_keys:
            conn.execute(sa.text(
                'INSERT INTO org_api_keys (org_id, key_name, encrypted_value) VALUES (:org_id, :key_name, :encrypted_value)'
            ), {"org_id": org_id, "key_name": key[0], "encrypted_value": key[1]})


def downgrade() -> None:
    op.drop_index('ix_usage_events_org_id', 'usage_events')
    op.drop_column('usage_events', 'org_id')
    op.drop_index('ix_voice_sessions_org_id', 'voice_sessions')
    op.drop_column('voice_sessions', 'org_id')
    op.drop_index('ix_agents_org_id', 'agents')
    op.drop_column('agents', 'org_id')
    op.drop_table('org_api_keys')
    op.drop_table('org_members')
    op.drop_table('organizations')
    try:
        op.drop_column('session', 'activeOrganizationId')
    except Exception:
        pass
