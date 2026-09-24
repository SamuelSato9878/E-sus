from pydantic import BaseModel, EmailStr

class SignUpRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class AuthResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    user_id: str
    email: str | None = None
    message: str | None = None
    