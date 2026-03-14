"""add telephony_provider column and rename twilio_sid

Revision ID: 20260314_add_telephony_provider
Revises: 20260306_rename_clerk_id
Create Date: 2026-03-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260314_add_telephony_provider'
down_revision: Union[str, None] = '20260306_rename_clerk_id'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add telephony_provider column
    op.add_column(
        'agents',
        sa.Column('telephony_provider', sa.String(length=20), nullable=True, server_default='twilio'),
    )

    # Rename twilio_sid -> provider_number_sid
    op.alter_column('agents', 'twilio_sid', new_column_name='provider_number_sid')

    # Backfill: set telephony_provider for agents that already have a phone number
    op.execute("UPDATE agents SET telephony_provider = 'twilio' WHERE phone_number IS NOT NULL")


def downgrade() -> None:
    # Rename back provider_number_sid -> twilio_sid
    op.alter_column('agents', 'provider_number_sid', new_column_name='twilio_sid')

    # Drop telephony_provider column
    op.drop_column('agents', 'telephony_provider')
