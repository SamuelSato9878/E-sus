from sqlalchemy import select
from sqlalchemy.orm import Session

from e_sus.modules.professional.models import Professional
from e_sus.modules.specialties.repository import SpecialtyRepository

from .models import MedicalService
from .repository import ServiceRepository
from .schemas import ServiceCreate, ServiceUpdate


class MedicalServiceService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ServiceRepository(db)
        self.specialties = SpecialtyRepository(db)

    def create(self, data: ServiceCreate) -> MedicalService:
        specialty = self._get_specialty(data.specialty_id)
        self._ensure_unique(data.name.strip(), data.specialty_id)
        service = MedicalService(
            name=data.name.strip(),
            description=data.description,
            duration_minutes=data.duration_minutes,
            buffer_minutes=data.buffer_minutes,
            specialty=specialty,
            professionals=self._get_professionals(data.professional_ids, data.specialty_id),
        )
        return self.repository.create(service)

    def get_by_id(self, service_id: int, include_inactive: bool = True) -> MedicalService:
        service = self.repository.get_by_id(service_id)
        if service is None:
            raise ValueError("Serviço não encontrado.")
        if not include_inactive and (not service.is_active or not service.specialty.is_active):
            raise ValueError("Serviço não encontrado.")
        return service

    def list(self, include_inactive: bool = True) -> list[MedicalService]:
        return self.repository.list(active_only=not include_inactive)

    def update(self, service_id: int, data: ServiceUpdate) -> MedicalService:
        service = self.get_by_id(service_id)
        changes = data.model_dump(exclude_unset=True)
        professional_ids = changes.pop("professional_ids", None)
        specialty_id = changes.get("specialty_id", service.specialty_id)
        if "specialty_id" in changes:
            specialty = self._get_specialty(specialty_id)
            service.specialty = specialty
        name = changes.get("name", service.name)
        if name is not None:
            name = name.strip()
            self._ensure_unique(name, specialty_id, current_id=service_id)
            changes["name"] = name
        if professional_ids is not None:
            service.professionals = self._get_professionals(professional_ids, specialty_id)
        elif "specialty_id" in changes:
            self._get_professionals(service.professional_ids, specialty_id)
        for field, value in changes.items():
            if value is not None or field == "description":
                setattr(service, field, value)
        return self.repository.save(service)

    def _get_specialty(self, specialty_id: int):
        specialty = self.specialties.get_by_id(specialty_id)
        if specialty is None or not specialty.is_active:
            raise ValueError("Especialidade ativa não encontrada.")
        return specialty

    def _get_professionals(self, professional_ids: list[int], specialty_id: int):
        if len(professional_ids) != len(set(professional_ids)):
            raise ValueError("A lista de profissionais contém duplicatas.")
        professionals = []
        for professional_id in professional_ids:
            professional = self.db.scalar(
                select(Professional).where(Professional.id == professional_id)
            )
            if professional is None or not professional.is_active:
                raise ValueError("Profissional ativo não encontrado.")
            if not any(specialty.id == specialty_id and specialty.is_active for specialty in professional.specialties):
                raise ValueError("Profissional não possui a especialidade do serviço.")
            professionals.append(professional)
        return professionals

    def _ensure_unique(self, name: str, specialty_id: int, current_id: int | None = None) -> None:
        existing = self.repository.get_by_name_and_specialty(name, specialty_id)
        if existing is not None and existing.id != current_id:
            raise ValueError("Serviço já cadastrado para esta especialidade.")
