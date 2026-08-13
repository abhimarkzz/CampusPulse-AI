from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10)
    category_id: UUID | None = None
    subcategory_id: UUID | None = None
    priority: str | None = None
    department_id: UUID | None = None
    campus_id: UUID | None = None
    building_id: UUID | None = None
    room_id: UUID | None = None
    latitude: float | None = None
    longitude: float | None = None


class ComplaintUpdateStatus(BaseModel):
    status: str
    note: str | None = None


class ComplaintAssign(BaseModel):
    assigned_to: UUID


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)
    is_internal: bool = False


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ComplaintRead(BaseModel):
    id: UUID
    ticket_number: str
    title: str
    description: str
    status: str
    priority: str
    category_id: UUID | None = None
    building_id: UUID | None = None
    room_id: UUID | None = None
    reporter_id: UUID
    assigned_to: UUID | None = None
    upvote_count: int
    ai_confidence: float | None = None
    sla_deadline: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
