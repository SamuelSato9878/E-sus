from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ServiceCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    duration_minutes: int = Field(gt=0)
    buffer_minutes: int = Field(default=0, ge=0)
    specialty_id: int
    professional_ids: list[int] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Nome do serviço é obrigatório.")
        return normalized


class ServiceUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    duration_minutes: int | None = Field(default=None, gt=0)
    buffer_minutes: int | None = Field(default=None, ge=0)
    specialty_id: int | None = None
    professional_ids: list[int] | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Nome do serviço não pode ser vazio.")
        return normalized


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    duration_minutes: int
    buffer_minutes: int
    specialty_id: int
    professional_ids: list[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime
