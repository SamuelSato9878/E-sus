from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.core.security import bearer_scheme
from e_sus.modules.auth.providers.supabase import SupabaseAuthProvider
from e_sus.modules.users.models import User


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    
    access_token = credentials.credentials

    provider = SupabaseAuthProvider()

    try:
        response = provider.get_user(access_token)

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token inválido ou expirado."
        )
        
    supabase_user = response.user


    if not supabase_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não autenticado.",
        )
        
    user = db.scalar(
        select(User).where(
            User.supabase_user_id == supabase_user.id
        )
    )
    

    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )   
        
    return user