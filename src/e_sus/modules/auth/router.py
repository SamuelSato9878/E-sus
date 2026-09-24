from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.schemas import (
    SignUpRequest,
    LoginRequest,
    AuthResponse,
)
from e_sus.modules.auth.service import AuthService
from e_sus.modules.users.models import User
from e_sus.modules.auth.dependencies import get_current_user


auth_router = APIRouter(prefix="/auth",tags=["Authentication"])


@auth_router.post("/signup", response_model=AuthResponse,status_code=status.HTTP_201_CREATED)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    service = AuthService(db)

    return service.signup(data)


@auth_router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)

    return service.signin(data)


@auth_router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return{
        "id": current_user.id,
        "supabase_user_id": current_user.supabase_user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
    }