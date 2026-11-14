from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr


class SignUpRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: SecretStr = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: SecretStr


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    supabase_user_id: str
    user_name: str
    email: EmailStr
    role: str


class AuthResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    user_id: str
    email: str | None = None
    message: str | None = None
    user: UserSummary | None = None


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    refresh_token: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str


class RecoveryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


class PasswordUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    access_token: str = Field(min_length=1)
    refresh_token: str = Field(min_length=1)
    password: SecretStr = Field(min_length=8, max_length=128)
