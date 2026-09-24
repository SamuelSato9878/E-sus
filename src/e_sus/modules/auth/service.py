from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from e_sus.modules.users.models import User
from e_sus.modules.auth.providers.supabase import SupabaseAuthProvider
from e_sus.modules.auth.schemas import SignUpRequest, LoginRequest
from e_sus.modules.auth.repository import AuthRepository


class AuthService:

    def __init__(self, db: Session):
        self.repository = AuthRepository(db)
        self.provider = SupabaseAuthProvider()

    def signup(self, data: SignUpRequest) -> dict:

        # 1. Verifica se já existe no banco local
        existing_user = self.repository.get_by_email(data.email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O usuário já está cadastrado.",
            )

        # 2. Cria usuário no Supabase
        try:
            response = self.provider.sign_up(
                name=data.name,
                email=data.email,
                password=data.password,
            )

        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(error),
            )

        # 3. Verifica se o Supabase criou o usuário
        supabase_user = response.user

        if not supabase_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível criar o usuário no Supabase.",
            )
            
        user = User(
            name=data.name,
            email=data.email,
            supabase_user_id=supabase_user.id
        )

        # 4. Salva usuário no banco local
        try:
            user = self.repository.create(user)

        except Exception:
            self.repository.db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao salvar os dados do usuário.",
            )

        # 5. Se confirmação de e-mail estiver habilitada,
        # pode não existir session ainda.
        if not response.session:
            return {
                "access_token": None,
                "refresh_token": None,
                "user_id": supabase_user.id,
                "email": supabase_user.email,
                "message": (
                    "Cadastro realizado com sucesso. "
                    "Verifique seu e-mail para confirmar a conta."
                ),
            }

        # 6. Caso o Supabase já tenha criado uma sessão
        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": supabase_user.id,
            "email": supabase_user.email,
            "message": "Usuário cadastrado com sucesso.",
        }

    def signin(self, data: LoginRequest) -> dict:

        try:
            response = self.provider.sign_in(
                email=data.email,
                password=data.password,
            )

        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha inválidos.",
            )

        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuário não encontrado.",
            )

        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Não foi possível obter a sessão.",
            )

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
            "email": response.user.email,
        }