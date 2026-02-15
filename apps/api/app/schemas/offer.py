import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.offer import OfferStatus


class OfferCreate(BaseModel):
    status: OfferStatus = Field(default=OfferStatus.draft, description="סטטוס הצעה")
    amount_estimated: Optional[float] = Field(None, description="סכום משוער")


class OfferUpdate(BaseModel):
    status: Optional[OfferStatus] = None
    amount_estimated: Optional[float] = None


class OfferResponse(BaseModel):
    id: uuid.UUID
    lead_id: uuid.UUID
    file_path: str
    amount_estimated: Optional[float] = None
    status: OfferStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
