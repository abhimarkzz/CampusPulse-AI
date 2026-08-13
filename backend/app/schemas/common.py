from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, BeforeValidator, Field

_EMAIL_RE = __import__("re").compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def _validate_email(value: str) -> str:
    value = value.strip().lower()
    try:
        from email_validator import EmailNotValidError, validate_email

        return validate_email(value, check_deliverability=False).normalized
    except Exception as exc:
        if _EMAIL_RE.match(value):
            return value
        raise ValueError("Enter a valid email address") from exc


AppEmailStr = Annotated[str, BeforeValidator(_validate_email)]


class ApiResponse(BaseModel):
    data: object
    meta: dict | None = None


class ApiError(BaseModel):
    error: str
    code: str
    message: str
    details: object | None = None
    request_id: str | None = None


class UserBase(BaseModel):
    email: AppEmailStr
    full_name: str = Field(min_length=2, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: UUID
    role: str
    department_id: UUID | None = None
    is_active: bool
    is_verified: bool
    avatar_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: AppEmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class DashboardStats(BaseModel):
    total_complaints: int
    open_complaints: int
    resolved_today: int
    sla_at_risk: int
    campus_health_score: int
