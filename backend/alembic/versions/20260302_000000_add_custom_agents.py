"""add_custom_agents

Revision ID: d4e5f6a7b8c9
Revises: b3f7c2e1d4a6
Create Date: 2026-03-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'b3f7c2e1d4a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create new enum types
    agentmode = sa.Enum('STANDARD', 'CUSTOM', name='agentmode')
    agentmode.create(op.get_bind(), checkfirst=True)

    agentbuildstatus = sa.Enum('NONE', 'PENDING', 'BUILDING', 'READY', 'FAILED', name='agentbuildstatus')
    agentbuildstatus.create(op.get_bind(), checkfirst=True)

    # Add custom agent columns to agents table
    op.add_column('agents', sa.Column('agent_mode', agentmode, nullable=False, server_default='STANDARD'))
    op.add_column('agents', sa.Column('storage_path', sa.String(length=500), nullable=True))
    op.add_column('agents', sa.Column('image_tag', sa.String(length=255), nullable=True))
    op.add_column('agents', sa.Column('build_status', agentbuildstatus, nullable=False, server_default='NONE'))
    op.add_column('agents', sa.Column('build_error', sa.Text(), nullable=True))
    op.add_column('agents', sa.Column('last_build_at', sa.DateTime(), nullable=True))
    op.add_column('agents', sa.Column('current_version', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('agents', sa.Column('deployed_version', sa.Integer(), nullable=True))

    # Create agent_files table
    op.create_table(
        'agent_files',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=True),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('agent_id', sa.String(36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.UniqueConstraint('agent_id', 'file_path', name='uq_agent_files_agent_path'),
    )

    # Create agent_file_versions table
    op.create_table(
        'agent_file_versions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=True),
        sa.Column('minio_key', sa.String(500), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('agent_file_id', sa.String(36), sa.ForeignKey('agent_files.id', ondelete='CASCADE'), nullable=False),
    )

    # Create agent_containers table
    op.create_table(
        'agent_containers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('container_id', sa.String(100), nullable=True),
        sa.Column('container_type', sa.String(50), nullable=False, server_default='agent'),
        sa.Column('status', sa.Enum('PENDING', 'RUNNING', 'STOPPED', 'FAILED', name='containerstatus'), nullable=False, server_default='PENDING'),
        sa.Column('image_tag', sa.String(255), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('stopped_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('agent_id', sa.String(36), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_id', sa.String(36), sa.ForeignKey('voice_sessions.id', ondelete='SET NULL'), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('agent_containers')
    op.drop_table('agent_file_versions')
    op.drop_table('agent_files')

    op.drop_column('agents', 'deployed_version')
    op.drop_column('agents', 'current_version')
    op.drop_column('agents', 'last_build_at')
    op.drop_column('agents', 'build_error')
    op.drop_column('agents', 'build_status')
    op.drop_column('agents', 'image_tag')
    op.drop_column('agents', 'storage_path')
    op.drop_column('agents', 'agent_mode')

    sa.Enum(name='containerstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='agentbuildstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='agentmode').drop(op.get_bind(), checkfirst=True)
