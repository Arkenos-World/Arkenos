"""rename clerk_id to auth_id

Revision ID: 20260306_rename_clerk_id
Revises: f6a7b8c9d0e1
Create Date: 2026-03-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '20260306_rename_clerk_id'
down_revision: Union[str, None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('users', 'clerk_id', new_column_name='auth_id')
    # Rename the index too
    op.execute('ALTER INDEX IF EXISTS ix_users_clerk_id RENAME TO ix_users_auth_id')


def downgrade() -> None:
    op.alter_column('users', 'auth_id', new_column_name='clerk_id')
    op.execute('ALTER INDEX IF EXISTS ix_users_auth_id RENAME TO ix_users_clerk_id')
