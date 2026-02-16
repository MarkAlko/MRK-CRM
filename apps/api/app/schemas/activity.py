import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.activity import ActivityType
from app.schemas.user import UserResponse


class ActivityCreate(BaseModel):
    type: ActivityType = Field(..., description="סוג פעילות")
    description: Optional[str] = Field(None, description="תיאור")


class ActivityResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    type: ActivityType
    description: Optional[str] = None
    created_by: uuid.UUID
    creator: Optional[UserResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}
