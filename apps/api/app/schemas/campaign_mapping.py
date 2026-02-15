import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CampaignMappingCreate(BaseModel):
    contains_text: str = Field(
        ..., min_length=1, max_length=500, description="טקסט לחיפוש בשם הקמפיין"
    )
    project_type_key: str = Field(..., description="מפתח סוג פרויקט")
    priority: int = Field(default=100, ge=1, le=10000, description="עדיפות")

    @field_validator("contains_text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("טקסט חיפוש לא יכול להיות ריק")
        return v.strip()

    @field_validator("project_type_key")
    @classmethod
    def valid_project_type(cls, v: str) -> str:
        valid_keys = {"mamad", "private_home", "renovation", "architecture"}
        if v not in valid_keys:
            raise ValueError(
                f"מפתח סוג פרויקט לא תקין. ערכים אפשריים: {', '.join(valid_keys)}"
            )
        return v


class CampaignMappingUpdate(BaseModel):
    contains_text: Optional[str] = Field(None, min_length=1, max_length=500)
    project_type_key: Optional[str] = None
    priority: Optional[int] = Field(None, ge=1, le=10000)
    is_active: Optional[bool] = None

    @field_validator("project_type_key")
    @classmethod
    def valid_project_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        valid_keys = {"mamad", "private_home", "renovation", "architecture"}
        if v not in valid_keys:
            raise ValueError(
                f"מפתח סוג פרויקט לא תקין. ערכים אפשריים: {', '.join(valid_keys)}"
            )
        return v


class CampaignMappingResponse(BaseModel):
    id: uuid.UUID
    contains_text: str
    project_type_key: str
    priority: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
