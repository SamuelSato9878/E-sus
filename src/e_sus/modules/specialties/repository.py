from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .models import Specialty


class SpecialtyRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, specialty_id: int) -> Specialty | None:
        return self.db.scalar(
            select(Specialty).options(selectinload(Specialty.professionals)).where(Specialty.id == specialty_id)
        )

    def get_by_name(self, name: str) -> Specialty | None:
        return self.db.scalar(select(Specialty).where(Specialty.name == name))

    def list(self, active_only: bool = False) -> list[Specialty]:
        statement = select(Specialty).options(selectinload(Specialty.professionals))
        if active_only:
            statement = statement.where(Specialty.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def create(self, specialty: Specialty) -> Specialty:
        self.db.add(specialty)
        self._commit()
        self.db.refresh(specialty)
        return specialty

    def save(self, specialty: Specialty) -> Specialty:
        self._commit()
        self.db.refresh(specialty)
        return specialty

    def _commit(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("Especialidade já cadastrada.") from error
