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
                user_name=data.user_name,
                email=data.email,
                password=data.password.get_secret_value(),
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
            user_name=data.user_name,
            email=data.email,
            supabase_user_id=supabase_user.id
        )

        # 4. Salva usuário no banco local
        try:
            user = self.repository.create_patient_user(user)

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

    @staticmethod
    def _error_status(error: Exception) -> int | None:
        value = getattr(error, "status", None)
        return value if isinstance(value, int) else None

    def signin(self, data: LoginRequest) -> dict:
        try:
            response = self.provider.sign_in(
                email=str(data.email),
                password=data.password.get_secret_value(),
            )
        except Exception as error:
            code = self._error_status(error)
            temporary = code is None or code == 429 or code >= 500
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE if temporary else status.HTTP_401_UNAUTHORIZED,
                detail="Serviço de autenticação temporariamente indisponível." if temporary else "E-mail ou senha inválidos.",
            )

        if not response.user or not response.session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos.")

        user = self.repository.get_by_supabase_user_id(response.user.id)
        if not user:
            try:
                self.provider.sign_out(response.session.access_token)
            except Exception:
                pass
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user_id": response.user.id,
            "email": response.user.email,
            "user": user,
        }

    def refresh(self, refresh_token: str) -> dict:
        try:
            response = self.provider.refresh_session(refresh_token)
        except Exception as error:
            code = self._error_status(error)
            temporary = code is None or code == 429 or code >= 500
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE if temporary else status.HTTP_401_UNAUTHORIZED,
                detail="Não foi possível renovar a sessão." if temporary else "Sessão inválida ou expirada.",
            )
        if not response.session:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Não foi possível renovar a sessão.")
        return {"access_token": response.session.access_token, "refresh_token": response.session.refresh_token}

    def logout(self, access_token: str) -> None:
        try:
            self.provider.sign_out(access_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Não foi possível encerrar a sessão no provedor de identidade.",
            )

    def request_password_recovery(self, email: str) -> dict:
        from e_sus.core.config import settings
        try:
            self.provider.request_password_recovery(email, settings.SUPABASE_PASSWORD_RESET_REDIRECT_TO)
        except Exception:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Não foi possível processar a solicitação.")
        return {"message": "Se o e-mail estiver cadastrado, você receberá as instruções."}

    def update_password(self, access_token: str, refresh_token: str, password: str) -> dict:
        try:
            self.provider.update_password(access_token, refresh_token, password)
        except Exception as error:
            code = self._error_status(error)
            invalid = code is not None and code < 500 and code != 429
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED if invalid else status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Link inválido ou expirado." if invalid else "Não foi possível atualizar a senha.",
            )
        return {"message": "Senha atualizada com sucesso."}
