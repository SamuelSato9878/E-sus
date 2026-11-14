from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.core.security import bearer_scheme
from e_sus.modules.auth.dependencies import get_authenticated_user
from e_sus.modules.auth.schemas import (
    AuthResponse, LoginRequest, PasswordUpdateRequest, RecoveryRequest,
    RefreshRequest, SignUpRequest, TokenResponse,
)
from e_sus.modules.auth.service import AuthService
from e_sus.modules.users.models import User

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    return AuthService(db).signup(data)


@auth_router.post("/login", response_model=AuthResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService(db).signin(data)


@auth_router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return AuthService(db).refresh(data.refresh_token)


@auth_router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    AuthService(db).logout(credentials.credentials)
    return {"message": "Sessão encerrada."}


@auth_router.post("/recover")
def recover(data: RecoveryRequest, db: Session = Depends(get_db)):
    return AuthService(db).request_password_recovery(str(data.email))


@auth_router.post("/password")
def update_password(data: PasswordUpdateRequest, db: Session = Depends(get_db)):
    return AuthService(db).update_password(
        data.access_token, data.refresh_token, data.password.get_secret_value()
    )


@auth_router.get("/me")
def get_me(current_user: User = Depends(get_authenticated_user)):
    return {
        "id": current_user.id,
        "supabase_user_id": current_user.supabase_user_id,
        "user_name": current_user.user_name,
        "email": current_user.email,
        "role": current_user.role,
    }
