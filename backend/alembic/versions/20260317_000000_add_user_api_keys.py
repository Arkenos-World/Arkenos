"""add user_api_keys table for per-user API key storage

Revision ID: 20260317_add_user_api_keys
Revises: 20260314_add_telephony_provider
Create Date: 2026-03-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260317_add_user_api_keys'
down_revision: Union[str, None] = '20260314_add_telephony_provider'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_api_keys',
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('key_name', sa.String(length=100), primary_key=True),
        sa.Column('encrypted_value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('user_api_keys')
