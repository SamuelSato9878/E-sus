from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from .models import Professional


class ProfessionalRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, professional_id: int) -> Professional | None:
        return self.db.scalar(
            select(Professional)
            .options(selectinload(Professional.specialties), selectinload(Professional.services))
            .where(Professional.id == professional_id)
        )

    def get_by_council(self, council_type: str, council_state: str, council_number: str):
        return self.db.scalar(
            select(Professional).where(
                Professional.council_type == council_type,
                Professional.council_state == council_state,
                Professional.council_number == council_number,
            )
        )

    def list(self, active_only: bool = False) -> list[Professional]:
        statement = select(Professional).options(
            selectinload(Professional.specialties), selectinload(Professional.services)
        )
        if active_only:
            statement = statement.where(Professional.is_active.is_(True))
        return list(self.db.scalars(statement).all())

    def create(self, professional: Professional) -> Professional:
        self.db.add(professional)
        self._commit()
        self.db.refresh(professional)
        return professional

    def save(self, professional: Professional) -> Professional:
        self._commit()
        self.db.refresh(professional)
        return professional

    def _commit(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("Registro de conselho já cadastrado.") from error
