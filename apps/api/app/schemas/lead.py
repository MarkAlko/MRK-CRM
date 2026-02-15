import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.lead import LeadSource, LeadStatus, LeadTemperature
from app.schemas.user import UserResponse


class LeadCreate(BaseModel):
    project_type_id: int = Field(..., description="מזהה סוג פרויקט")
    full_name: str = Field(..., min_length=2, max_length=255, description="שם מלא")
    phone: str = Field(..., min_length=9, max_length=30, description="מספר טלפון")
    email: Optional[str] = Field(None, description="כתובת אימייל")
    source: LeadSource = Field(default=LeadSource.manual, description="מקור הליד")
    campaign_name: Optional[str] = None
    adset_name: Optional[str] = None
    ad_name: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    temperature: Optional[LeadTemperature] = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("שם מלא לא יכול להיות ריק")
        return v.strip()

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        import re

        cleaned = re.sub(r"[\s\-\(\)\+]", "", v)
        if not cleaned.isdigit():
            raise ValueError("מספר טלפון חייב להכיל ספרות בלבד")
        if len(cleaned) < 9:
            raise ValueError("מספר טלפון קצר מדי")
        return v


class LeadUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, min_length=9, max_length=30)
    email: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    temperature: Optional[LeadTemperature] = None
    qualifier_id: Optional[uuid.UUID] = None
    closer_id: Optional[uuid.UUID] = None
    start_timeline: Optional[str] = None
    plans_status: Optional[str] = None
    permit_status: Optional[str] = None
    building_type: Optional[str] = None
    site_access: Optional[str] = None
    estimated_size_bucket: Optional[str] = None
    is_occupied: Optional[str] = None
    mamad_variant: Optional[str] = None
    private_stage: Optional[str] = None
    private_special_struct: Optional[dict[str, Any]] = None
    arch_service: Optional[str] = None
    arch_property_type: Optional[str] = None
    arch_planning_stage: Optional[str] = None
    arch_existing_docs: Optional[dict[str, Any]] = None
    reno_type: Optional[str] = None
    reno_has_plan: Optional[str] = None


class LeadTransition(BaseModel):
    to_status: LeadStatus = Field(..., description="סטטוס יעד")


class LeadAssignCloser(BaseModel):
    closer_id: uuid.UUID = Field(..., description="מזהה הקלוזר")


class ProjectTypeResponse(BaseModel):
    id: int
    key: str
    display_name_he: str
    is_active: bool

    model_config = {"from_attributes": True}


class LeadResponse(BaseModel):
    id: uuid.UUID
    project_type_id: int
    project_type: Optional[ProjectTypeResponse] = None
    full_name: str
    phone: str
    normalized_phone: str
    email: Optional[str] = None
    source: LeadSource
    campaign_name: Optional[str] = None
    adset_name: Optional[str] = None
    ad_name: Optional[str] = None
    city: Optional[str] = None
    street: Optional[str] = None
    temperature: Optional[LeadTemperature] = None
    status: LeadStatus
    qualifier_id: Optional[uuid.UUID] = None
    qualifier: Optional[UserResponse] = None
    closer_id: Optional[uuid.UUID] = None
    closer: Optional[UserResponse] = None
    bot_payload: Optional[dict[str, Any]] = None
    bot_track: Optional[str] = None
    bot_completed: bool = False
    start_timeline: Optional[str] = None
    plans_status: Optional[str] = None
    permit_status: Optional[str] = None
    building_type: Optional[str] = None
    site_access: Optional[str] = None
    estimated_size_bucket: Optional[str] = None
    is_occupied: Optional[str] = None
    mamad_variant: Optional[str] = None
    private_stage: Optional[str] = None
    private_special_struct: Optional[dict[str, Any]] = None
    arch_service: Optional[str] = None
    arch_property_type: Optional[str] = None
    arch_planning_stage: Optional[str] = None
    arch_existing_docs: Optional[dict[str, Any]] = None
    reno_type: Optional[str] = None
    reno_has_plan: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LeadListResponse(BaseModel):
    items: list[LeadResponse]
    total: int
    page: int
    page_size: int
    pages: int
