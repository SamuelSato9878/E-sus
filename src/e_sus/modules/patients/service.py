from sqlalchemy.orm import Session

from e_sus.modules.users.models import User, UserRole

from .models import Patient
from .repository import PatientRepository
from .schemas import PatientAdminUpdate, PatientProfileFields, PatientSelfUpdate


class PatientService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = PatientRepository(db)

    def create(self, user_id: int, data: PatientProfileFields) -> Patient:
        user = self.db.get(User, user_id)
        if user is None or user.role != UserRole.PATIENT:
            raise ValueError("Usuário paciente não encontrado.")
        if self.repository.get_by_user_id(user_id):
            raise ValueError("Este usuário já possui perfil de paciente.")
        if data.cpf and self.repository.get_by_cpf(data.cpf):
            raise ValueError("CPF já cadastrado.")

        return self.repository.create(
            Patient(user_id=user_id, is_active=True, **data.model_dump(exclude={"user_id"}))
        )

    def get_by_id(self, patient_id: int) -> Patient:
        patient = self.repository.get_by_id(patient_id)
        if patient is None:
            raise ValueError("Paciente não encontrado.")
        return patient

    def get_by_user_id(self, user_id: int) -> Patient:
        patient = self.repository.get_by_user_id(user_id)
        if patient is None:
            raise ValueError("Perfil de paciente não encontrado.")
        return patient

    def list(self) -> list[Patient]:
        return self.repository.list()

    def update(self, patient_id: int, data: PatientAdminUpdate) -> Patient:
        patient = self.get_by_id(patient_id)
        changes = data.model_dump(exclude_unset=True)
        cpf = changes.get("cpf")
        if cpf is not None:
            existing = self.repository.get_by_cpf(cpf)
            if existing is not None and existing.id != patient_id:
                raise ValueError("CPF já cadastrado.")
        requested_active = changes.pop("is_active", None)
        for field, value in changes.items():
            if value is not None or field in {"address", "sex"}:
                setattr(patient, field, value)
        if requested_active is not None:
            patient.is_active = requested_active
        return self.repository.save(patient)

    def update_own(self, user_id: int, data: PatientSelfUpdate) -> Patient:
        patient = self.get_by_user_id(user_id)
        changes = data.model_dump(exclude_unset=True)
        cpf = changes.get("cpf")
        if cpf is not None:
            existing = self.repository.get_by_cpf(cpf)
            if existing is not None and existing.id != patient.id:
                raise ValueError("CPF já cadastrado.")
        for field, value in changes.items():
            if value is not None or field in {"address", "sex"}:
                setattr(patient, field, value)
        return self.repository.save(patient)



