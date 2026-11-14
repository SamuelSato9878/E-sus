from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.core.security import bearer_scheme
from e_sus.modules.auth.providers.supabase import SupabaseAuthProvider
from e_sus.modules.users.models import User, UserRole


def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    provider = SupabaseAuthProvider()
    try:
        response = provider.get_user(credentials.credentials)
    except Exception as error:
        provider_status = getattr(error, "status", None)
        temporary = provider_status is None or provider_status == 429 or provider_status >= 500
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE if temporary else status.HTTP_401_UNAUTHORIZED,
            detail="Serviço de autenticação temporariamente indisponível." if temporary else "Token inválido ou expirado.",
        )

    supabase_user = response.user
    if not supabase_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado.")

    user = db.scalar(select(User).where(User.supabase_user_id == supabase_user.id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")
    return user


def get_current_user(user: User = Depends(get_authenticated_user)) -> User:
    # Preserve the existing policy for routes that are not role-specific yet.
    if user.role == UserRole.PROFESSIONAL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este tipo de usuário não possui acesso autenticado.",
        )
    return user


def require_role(role: UserRole):
    def dependency(current_user: User = Depends(get_authenticated_user)) -> User:
        if current_user.role != role:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permissão insuficiente.")
        return current_user
    return dependency


require_admin = require_role(UserRole.ADMIN)
require_patient = require_role(UserRole.PATIENT)
