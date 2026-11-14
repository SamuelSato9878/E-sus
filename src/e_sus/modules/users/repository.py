from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from e_sus.modules.patients.models import Patient

from .models import User


class UserRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user

    def create_patient_user(self, user: User) -> User:
        """Create a user and its patient profile in one transaction."""
        self.db.add(user)
        self.db.flush()
        self.db.add(Patient(user_id=user.id, is_active=True))
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(
            User.email == email
        )

        return self.db.scalar(statement)

    def get_by_supabase_user_id(self, supabase_user_id: str) -> User | None:
        statement = select(User).where(
            User.supabase_user_id == supabase_user_id
        )
        return self.db.scalar(statement)

    def get_all(self) -> list[User]:
        statement = select(User)

        return list(
            self.db.scalars(statement).all()
        )

    def update(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)

        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        try:
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("Usuário possui dados vinculados e não pode ser excluído.") from error

