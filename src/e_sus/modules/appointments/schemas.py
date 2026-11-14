from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator


def _utc(value: datetime | None):
    if value is None:
        return None
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


class AppointmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: int | None = Field(default=None, gt=0)
    professional_id: int = Field(gt=0)
    service_id: int = Field(gt=0)
    start_at: datetime

    @field_validator("start_at")
    @classmethod
    def require_offset(cls, value):
        if value.tzinfo is None:
            raise ValueError("Data e hora devem incluir o fuso horário.")
        return value


class AppointmentReschedule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    start_at: datetime
    reason: str | None = Field(default=None, max_length=500)

    @field_validator("start_at")
    @classmethod
    def require_offset(cls, value):
        if value.tzinfo is None:
            raise ValueError("Data e hora devem incluir o fuso horário.")
        return value


class AppointmentCancel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str | None = Field(default=None, max_length=500)


class AppointmentHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    action: str
    previous_start_at: datetime | None
    previous_end_at: datetime | None
    new_start_at: datetime | None
    new_end_at: datetime | None
    previous_status: str | None
    new_status: str | None
    reason: str | None
    changed_by_user_id: int
    created_at: datetime

    @field_serializer("previous_start_at", "previous_end_at", "new_start_at", "new_end_at", "created_at")
    def serialize_times(self, value):
        return _utc(value)


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    verification_code: str
    patient_id: int
    patient_name: str
    professional_id: int
    professional_name: str
    service_id: int
    service_name: str
    start_at: datetime
    end_at: datetime
    status: str
    created_at: datetime
    updated_at: datetime

    @field_serializer("start_at", "end_at", "created_at", "updated_at")
    def serialize_times(self, value):
        return _utc(value)


class AppointmentDetail(AppointmentResponse):
    history: list[AppointmentHistoryResponse]
