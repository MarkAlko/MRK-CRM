import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="שם מלא")
    email: EmailStr = Field(..., description="כתובת אימייל")
    password: str = Field(..., min_length=6, max_length=128, description="סיסמה")
    role: UserRole = Field(..., description="תפקיד")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("שם לא יכול להיות ריק")
        return v.strip()


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
