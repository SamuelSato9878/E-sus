from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfessionalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    council_number: str | None = Field(default=None, max_length=50)
    council_type: str | None = Field(default=None, max_length=30)
    council_state: str = Field(min_length=2, max_length=2)
    specialty_ids: list[int] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def require_non_blank(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("O campo é obrigatório.")
        return normalized

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("council_number")
    @classmethod
    def normalize_council_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("council_type")
    @classmethod
    def normalize_council_type(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        return normalized or None

    @field_validator("council_state")
    @classmethod
    def normalize_council_state(cls, value: str) -> str:
        state = value.strip().upper()
        if not state.isascii() or not state.isalpha():
            raise ValueError("UF do conselho inválida.")
        return state


class ProfessionalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=150)
    phone: str | None = Field(default=None, max_length=30)
    council_number: str | None = Field(default=None, max_length=50)
    council_type: str | None = Field(default=None, max_length=30)
    council_state: str | None = Field(default=None, min_length=2, max_length=2)
    specialty_ids: list[int] | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def reject_blank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("O campo não pode ser vazio.")
        return normalized

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("council_number")
    @classmethod
    def normalize_council_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("council_type")
    @classmethod
    def normalize_council_type(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        return normalized or None

    @field_validator("council_state")
    @classmethod
    def normalize_council_state(cls, value: str | None) -> str | None:
        if value is None:
            return value
        state = value.strip().upper()
        if not state.isascii() or not state.isalpha():
            raise ValueError("UF do conselho inválida.")
        return state


class ProfessionalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str | None
    council_number: str | None
    council_type: str | None
    council_state: str
    is_active: bool
    specialty_ids: list[int]
    service_ids: list[int]
    created_at: datetime
    updated_at: datetime
