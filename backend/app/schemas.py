from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Literal, Optional
from decimal import Decimal
from app.models import AgentType, AgentMode, AgentBuildStatus, ContainerStatus, SessionStatus, TranscriptSpeaker, CallDirection, CallStatus, UsageEventType, TransferType


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    clerk_id: str


class UserResponse(UserBase):
    id: str
    clerk_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Agent Schemas
class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: AgentType
    config: dict = {}


class AgentCreate(AgentBase):
    user_id: str
    agent_mode: str = "STANDARD"


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None


class AgentResponse(AgentBase):
    id: str
    is_active: bool
    user_id: str
    phone_number: Optional[str] = None
    twilio_sid: Optional[str] = None
    agent_mode: Optional[AgentMode] = None
    storage_path: Optional[str] = None
    image_tag: Optional[str] = None
    build_status: Optional[AgentBuildStatus] = None
    current_version: int = 0
    deployed_version: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Voice Session Schemas
class VoiceSessionBase(BaseModel):
    room_name: str
    metadata: dict = Field(default={}, alias="session_data")
    
    model_config = {"populate_by_name": True}


class VoiceSessionCreate(VoiceSessionBase):
    user_id: str
    agent_id: Optional[str] = None


class VoiceSessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None
    metadata: Optional[dict] = None


class VoiceSessionResponse(VoiceSessionBase):
    id: str
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    duration: Optional[int]
    user_id: str
    agent_id: Optional[str]
    agent_name: Optional[str] = None  # Added for displaying agent name in UI
    call_direction: Optional[CallDirection] = None
    outbound_phone_number: Optional[str] = None
    call_status: Optional[CallStatus] = None
    analysis: Optional[dict] = None  # Extracted from session_data["analysis"]
    transferred_to: Optional[str] = None
    transfer_type: Optional[TransferType] = None
    transfer_timestamp: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="wrap")
    @classmethod
    def _extract_analysis(cls, data, handler):
        instance = handler(data)
        # Extract analysis from session_data when validating from ORM object
        if hasattr(data, "session_data") and data.session_data:
            instance.analysis = data.session_data.get("analysis")
        elif isinstance(data, dict):
            sd = data.get("session_data") or data.get("metadata") or {}
            if isinstance(sd, dict):
                instance.analysis = sd.get("analysis")
        return instance


# Transcript Schemas
class TranscriptBase(BaseModel):
    content: str
    speaker: TranscriptSpeaker


class TranscriptCreate(TranscriptBase):
    session_id: str


class TranscriptCreateByRoom(TranscriptBase):
    """Transcript creation schema when using room name (session_id derived from room)."""
    pass


class TranscriptResponse(TranscriptBase):
    id: str
    session_id: str
    timestamp: datetime

    class Config:
        from_attributes = True


# LiveKit Schemas
class TokenRequest(BaseModel):
    room_name: str
    user_id: str
    user_name: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    ws_url: str
    room_name: str


# Outbound Call Schemas
class OutboundCallRequest(BaseModel):
    agent_id: str
    phone_number: str  # E.164 format, e.g. +15551234567
    callback_url: Optional[str] = None


class OutboundCallResponse(BaseModel):
    call_id: str
    room_name: str
    status: CallStatus

    class Config:
        from_attributes = True


class CallStatusResponse(BaseModel):
    call_id: str
    status: SessionStatus
    call_status: Optional[CallStatus] = None
    call_direction: Optional[CallDirection] = None
    outbound_phone_number: Optional[str] = None
    room_name: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[int] = None

    class Config:
        from_attributes = True


# Usage Event Schemas
class UsageEventCreate(BaseModel):
    session_id: str
    user_id: str
    agent_id: Optional[str] = None
    provider: str
    event_type: UsageEventType
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal


class UsageEventResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    agent_id: Optional[str] = None
    provider: str
    event_type: UsageEventType
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# Cost Endpoint Schemas
class CostSummaryResponse(BaseModel):
    total_cost: Decimal
    this_month_cost: Decimal
    by_provider: dict[str, Decimal]


class TimelinePointResponse(BaseModel):
    date: str
    total_cost: Decimal
    by_provider: dict[str, Decimal]


class AgentCostResponse(BaseModel):
    agent_id: str
    agent_name: str
    total_cost: Decimal
    session_count: int
    event_count: int


class SessionCostBreakdownResponse(BaseModel):
    session_id: str
    total_cost: Decimal
    events: list[UsageEventResponse]
    cost_by_type: dict[str, Decimal]


# Call Transfer Schemas
class TransferRequest(BaseModel):
    phone_number: str  # E.164 format
    type: TransferType


class TransferResponse(BaseModel):
    session_id: str
    transfer_type: TransferType
    transferred_to: str
    status: str
    message: str


# ---- Custom Agent Schemas ----

class AgentFileResponse(BaseModel):
    id: str
    agent_id: str
    file_path: str
    content_hash: Optional[str] = None
    size_bytes: int = 0
    mime_type: Optional[str] = None
    version: int = 1
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentFileContentResponse(BaseModel):
    file_path: str
    content: str
    version: int = 1
    size_bytes: int = 0
    mime_type: Optional[str] = None


class AgentFileCreateUpdate(BaseModel):
    content: str
    file_path: Optional[str] = None  # Optional; path comes from URL


class AgentFileTreeResponse(BaseModel):
    agent_id: str
    files: list[AgentFileResponse]
    total_size_bytes: int = 0


class ContainerResponse(BaseModel):
    id: str
    agent_id: str
    session_id: Optional[str] = None
    container_id: Optional[str] = None
    container_type: str = "agent"
    status: ContainerStatus
    image_tag: Optional[str] = None
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BuildStatusResponse(BaseModel):
    agent_id: str
    build_status: AgentBuildStatus
    build_error: Optional[str] = None
    current_version: int = 0
    deployed_version: Optional[int] = None
    image_tag: Optional[str] = None
    last_build_at: Optional[datetime] = None


class FileChange(BaseModel):
    file_path: str
    action: str  # "create", "update", "delete"
    content: Optional[str] = None


class CodingAgentRequest(BaseModel):
    agent_id: str
    prompt: str
    context_files: list[str] = []


class CodingAgentResponse(BaseModel):
    message: str
    file_changes: list[FileChange] = []
    applied: bool = False
