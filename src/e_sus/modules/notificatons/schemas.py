import re
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


class NotificationEventType(str, Enum):
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"
    REMINDER = "REMINDER"
    COMPLETED = "COMPLETED"


ALLOWED_PLACEHOLDERS = {"patient_name", "professional_name", "service_name", "date", "time"}


def validate_template(value: str) -> str:
    fields = set(re.findall(r"\{([^{}]+)\}", value))
    unknown = fields - ALLOWED_PLACEHOLDERS
    if unknown:
        raise ValueError(f"Placeholder(s) não permitido(s): {', '.join(sorted(unknown))}.")
    if value.count("{") != value.count("}"):
        raise ValueError("Template possui chaves incompletas.")
    return value


class NotificationRuleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_enabled: bool | None = None
    title_template: str | None = Field(default=None, min_length=1, max_length=150)
    body_template: str | None = Field(default=None, min_length=1, max_length=1000)
    reminder_minutes_before: int | None = Field(default=None, ge=1, le=43200)

    @field_validator("title_template", "body_template")
    @classmethod
    def check_template(cls, value):
        return None if value is None else validate_template(value)


class NotificationRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_type: NotificationEventType
    is_enabled: bool
    title_template: str
    body_template: str
    reminder_minutes_before: int | None
    updated_by_user_id: int | None
    updated_at: datetime


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    appointment_id: int | None
    event_type: NotificationEventType
    title: str
    body: str
    available_at: datetime
    read_at: datetime | None
    created_at: datetime

    @field_serializer("available_at", "read_at", "created_at")
    def serialize_times(self, value):
        if value is None:
            return None
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)

