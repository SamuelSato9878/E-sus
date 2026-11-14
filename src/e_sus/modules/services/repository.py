from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload, selectinload

from .models import MedicalService


class ServiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, service_id: int) -> MedicalService | None:
        return self.db.scalar(
            select(MedicalService)
            .options(joinedload(MedicalService.specialty), selectinload(MedicalService.professionals))
            .where(MedicalService.id == service_id)
        )

    def get_by_name_and_specialty(self, name: str, specialty_id: int) -> MedicalService | None:
        return self.db.scalar(
            select(MedicalService).where(
                MedicalService.name == name,
                MedicalService.specialty_id == specialty_id,
            )
        )

    def list(self, active_only: bool = False) -> list[MedicalService]:
        statement = select(MedicalService).options(
            joinedload(MedicalService.specialty), selectinload(MedicalService.professionals)
        )
        if active_only:
            statement = statement.where(
                MedicalService.is_active.is_(True),
                MedicalService.specialty.has(is_active=True),
            )
        return list(self.db.scalars(statement).all())

    def create(self, service: MedicalService) -> MedicalService:
        self.db.add(service)
        self._commit()
        self.db.refresh(service)
        return service

    def save(self, service: MedicalService) -> MedicalService:
        self._commit()
        self.db.refresh(service)
        return service

    def _commit(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("Serviço ou associação inválida/duplicada.") from error
