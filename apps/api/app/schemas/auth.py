from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="כתובת אימייל")
    password: str = Field(..., min_length=6, description="סיסמה")


class TokenPayload(BaseModel):
    sub: str
    role: str
    type: str = "access"


class RefreshRequest(BaseModel):
    pass
