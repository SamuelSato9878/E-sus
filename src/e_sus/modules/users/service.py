from .models import User
from .repository import UserRepository
from .schemas import UserCreate, UserUpdate

from sqlalchemy.orm import Session



class UserService:

    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def create(self, data: UserCreate) -> User:

        existing_user = self.repository.get_by_email(
            data.email
        )

        if existing_user:
            raise ValueError(
                "E-mail já cadastrado."
            )

        user = User(
            name=data.name,
            email=data.email,
            password=data.password
        )

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

        if data.name is not None:
            user.name = data.name

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

        if data.password is not None:
            user.password = data.password

        return self.repository.update(user)

    def delete(self, user_id: int) -> None:

        user = self.get_by_id(user_id)

        self.repository.delete(user)