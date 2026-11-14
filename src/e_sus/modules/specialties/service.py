from sqlalchemy.orm import Session

from .models import Specialty
from .repository import SpecialtyRepository
from .schemas import SpecialtyCreate, SpecialtyUpdate


class SpecialtyService:
    def __init__(self, db: Session):
        self.repository = SpecialtyRepository(db)

    def create(self, data: SpecialtyCreate) -> Specialty:
        name = data.name.strip()
        if self.repository.get_by_name(name):
            raise ValueError("Especialidade já cadastrada.")
        return self.repository.create(Specialty(name=name, description=data.description))

    def get_by_id(self, specialty_id: int, include_inactive: bool = True) -> Specialty:
        specialty = self.repository.get_by_id(specialty_id)
        if specialty is None or (not include_inactive and not specialty.is_active):
            raise ValueError("Especialidade não encontrada.")
        return specialty

    def list(self, include_inactive: bool = True) -> list[Specialty]:
        return self.repository.list(active_only=not include_inactive)

    def update(self, specialty_id: int, data: SpecialtyUpdate) -> Specialty:
        specialty = self.get_by_id(specialty_id)
        changes = data.model_dump(exclude_unset=True)
        if changes.get("name") is not None:
            name = changes["name"].strip()
            existing = self.repository.get_by_name(name)
            if existing is not None and existing.id != specialty_id:
                raise ValueError("Especialidade já cadastrada.")
            changes["name"] = name
        for field, value in changes.items():
            if value is not None or field == "description" or field == "is_active":
                setattr(specialty, field, value)
        return self.repository.save(specialty)
