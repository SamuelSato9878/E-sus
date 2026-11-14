from .models import User, UserRole
from .repository import UserRepository
from .schemas import AdminUserCreate, UserCreate, UserUpdate
from e_sus.modules.auth.providers.supabase_admin import SupabaseAdminProvider

from sqlalchemy.orm import Session



class UserService:

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def create_admin(self, data: AdminUserCreate) -> User:
        if self.repository.get_by_email(data.email):
            raise ValueError("E-mail já cadastrado.")

        provider = SupabaseAdminProvider()
        try:
            identity = provider.create_user(
                data.user_name,
                data.email,
                data.password.get_secret_value(),
            )
        except Exception as error:
            raise ValueError(
                "Não foi possível criar a identidade no Supabase. Verifique o e-mail e os requisitos da senha."
            ) from error

        user = User(
            user_name=data.user_name,
            email=data.email,
            supabase_user_id=identity.id,
            role=UserRole.ADMIN,
        )
        try:
            return self.repository.create(user)
        except Exception as error:
            self.repository.db.rollback()
            try:
                provider.delete_user(identity.id)
            except Exception:
                pass
            raise ValueError(
                "A identidade foi criada, mas não foi possível vinculá-la ao usuário local."
            ) from error
    def create(self, data: UserCreate) -> User:

        existing_user = self.repository.get_by_email(
            data.email
        )

        if existing_user:
            raise ValueError(
                "E-mail já cadastrado."
            )

        if self.repository.get_by_supabase_user_id(data.supabase_user_id):
            raise ValueError("A identidade Supabase já está vinculada a um usuário.")

        user = User(
            user_name=data.user_name,
            email=data.email,
            supabase_user_id=data.supabase_user_id,
            role=UserRole[data.role.value] if data.role else UserRole.PATIENT,
        )

        if user.role == UserRole.PATIENT:
            return self.repository.create_patient_user(user)

        return self.repository.create(user)

    def get_by_id(self, user_id: int) -> User:

        user = self.repository.get_by_id(user_id)

        if not user:
            raise ValueError(
                "Usuário não encontrado."
            )

        return user

    def get_all(self) -> list[User]:

        return self.repository.get_all()

    def update(
        self,
        user_id: int,
        data: UserUpdate
    ) -> User:

        user = self.get_by_id(user_id)

        if data.user_name is not None:
            user.user_name = data.user_name

        if data.email is not None:

            existing_user = (
                self.repository.get_by_email(data.email)
            )

            if (
                existing_user
                and existing_user.id != user_id
            ):
                raise ValueError(
                    "E-mail já está sendo utilizado."
                )

            user.email = data.email

        if data.role is not None:
            try:
                user.role = UserRole[data.role.value]
            except ValueError as error:
                raise ValueError("Papel de usuário inválido.") from error

        return self.repository.update(user)

    def delete(self, user_id: int) -> None:

        user = self.get_by_id(user_id)

        self.repository.delete(user)
