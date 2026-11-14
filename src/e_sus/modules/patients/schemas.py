from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .validators import normalize_and_validate_cpf


class PatientProfileFields(BaseModel):
    phone: str | None = Field(default=None, min_length=1, max_length=30)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    birth_date: date | None = None
    address: str | None = Field(default=None, max_length=500)
    sex: str | None = Field(default=None, max_length=50)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Telefone não pode ser vazio.")
        return normalized

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str | None) -> str | None:
        return normalize_and_validate_cpf(value) if value is not None else None


class PatientSelfCreate(PatientProfileFields):
    model_config = ConfigDict(extra="forbid")


class PatientAdminCreate(PatientProfileFields):
    model_config = ConfigDict(extra="forbid")

    phone: str | None = Field(default=None, min_length=1, max_length=30)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    birth_date: date | None = None
    user_id: int


class PatientSelfUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    phone: str | None = Field(default=None, min_length=1, max_length=30)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    birth_date: date | None = None
    address: str | None = Field(default=None, max_length=500)
    sex: str | None = Field(default=None, max_length=50)

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("Telefone não pode ser vazio.")
        return normalized

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, value: str | None) -> str | None:
        return normalize_and_validate_cpf(value) if value is not None else None


class PatientAdminUpdate(PatientSelfUpdate):
    is_active: bool | None = None


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    user_name: str
    email: EmailStr
    phone: str | None
    cpf: str | None
    birth_date: date | None
    address: str | None
    sex: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime



