"""add_agent_env_vars

Revision ID: 20260330_add_agent_env_vars
Revises: 20260318_add_multi_tenancy
Create Date: 2026-03-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260330_add_agent_env_vars'
down_revision: Union[str, None] = '20260318_add_multi_tenancy'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'agent_env_vars',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('key_name', sa.String(255), nullable=False),
        sa.Column('encrypted_value', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('agent_id', sa.String(36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('agent_id', 'key_name', name='uq_agent_env_vars_agent_key'),
    )


def downgrade() -> None:
    op.drop_table('agent_env_vars')
