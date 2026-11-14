from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .models import Patient


class PatientRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, patient: Patient) -> Patient:
        self.db.add(patient)
        self._commit()
        self.db.refresh(patient)
        return patient

    def get_by_id(self, patient_id: int) -> Patient | None:
        return self.db.scalar(
            select(Patient).options(joinedload(Patient.user)).where(Patient.id == patient_id)
        )

    def get_by_user_id(self, user_id: int) -> Patient | None:
        return self.db.scalar(
            select(Patient).options(joinedload(Patient.user)).where(Patient.user_id == user_id)
        )

    def get_by_cpf(self, cpf: str) -> Patient | None:
        return self.db.scalar(select(Patient).where(Patient.cpf == cpf))

    def list(self) -> list[Patient]:
        return list(self.db.scalars(select(Patient).options(joinedload(Patient.user))).all())

    def save(self, patient: Patient) -> Patient:
        self._commit()
        self.db.refresh(patient)
        return patient

    def _commit(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as error:
            self.db.rollback()
            raise ValueError("CPF ou usuário já vinculado a um perfil de paciente.") from error
