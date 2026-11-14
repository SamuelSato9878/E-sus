#from pydantic import BaseModel, EmailStr, Field

""" class UserCreate():
    name: str
    email: EmailStr
    phone: str = Field(
        pattern=r"^\d{2}9\d{8}$", 
        description="Telefone deve ter o formato DDD + 9 + 8 dígitos (apenas números)"
    )
    
 """
 
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr, field_validator

from .models import UserRole


class AssignableUserRole(str, Enum):
    PATIENT = "PATIENT"
    ADMIN = "ADMIN"


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_name: str
    email: EmailStr
    supabase_user_id: str
    role: AssignableUserRole | None = None


class AdminUserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: SecretStr = Field(min_length=8, max_length=128)

    @field_validator("user_name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Nome é obrigatório.")
        return normalized

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_name: str | None = None
    email: EmailStr | None = None
    role: AssignableUserRole | None = None


class UserResponse(BaseModel):
    id: int
    user_name: str
    email: EmailStr
    role: UserRole

    model_config = {
        "from_attributes": True
    }
