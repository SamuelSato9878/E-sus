from sqlalchemy.orm import Session

from e_sus.modules.professional.models import Professional
from e_sus.modules.specialties.repository import SpecialtyRepository

from .repository import ProfessionalRepository
from .schemas import ProfessionalCreate, ProfessionalUpdate


class ProfessionalService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ProfessionalRepository(db)
        self.specialties = SpecialtyRepository(db)

    def create(self, data: ProfessionalCreate) -> Professional:
        self._validate_council(
            data.council_type, data.council_state, data.council_number
        )
        professional = Professional(
            name=data.name,
            phone=data.phone,
            council_number=data.council_number,
            council_type=data.council_type,
            council_state=data.council_state,
            specialties=self._get_specialties(data.specialty_ids),
        )
        return self.repository.create(professional)

    def get_by_id(self, professional_id: int, include_inactive: bool = True) -> Professional:
        professional = self.repository.get_by_id(professional_id)
        if professional is None or (not include_inactive and not professional.is_active):
            raise ValueError("Profissional não encontrado.")
        return professional

    def list(self, include_inactive: bool = True) -> list[Professional]:
        return self.repository.list(active_only=not include_inactive)

    def update(self, professional_id: int, data: ProfessionalUpdate) -> Professional:
        professional = self.get_by_id(professional_id)
        changes = data.model_dump(exclude_unset=True)
        specialty_ids = changes.pop("specialty_ids", None)
        candidate = {
            "council_type": changes.get("council_type", professional.council_type),
            "council_state": changes.get("council_state", professional.council_state),
            "council_number": changes.get("council_number", professional.council_number),
        }
        if any(key in changes for key in ("council_type", "council_state", "council_number")):
            self._validate_council(**candidate, current_id=professional_id)
        if specialty_ids is not None:
            new_specialties = self._get_specialties(specialty_ids)
            new_ids = {item.id for item in new_specialties}
            if any(service.specialty_id not in new_ids for service in professional.services):
                raise ValueError("Não é possível remover especialidade utilizada por um serviço associado.")
            professional.specialties = new_specialties
        for field, value in changes.items():
            if value is not None or field in ("phone", "council_type", "council_number", "is_active"):
                setattr(professional, field, value)
        return self.repository.save(professional)

    def _get_specialties(self, specialty_ids: list[int]):
        if len(specialty_ids) != len(set(specialty_ids)):
            raise ValueError("A lista de especialidades contém duplicatas.")
        specialties = [self.specialties.get_by_id(item_id) for item_id in specialty_ids]
        if any(specialty is None or not specialty.is_active for specialty in specialties):
            raise ValueError("Especialidade ativa não encontrada.")
        return specialties

    def _validate_council(
        self,
        council_type: str | None,
        council_state: str,
        council_number: str | None,
        current_id: int | None = None,
    ) -> None:
        if not council_type or not council_number:
            return
        existing = self.repository.get_by_council(council_type, council_state, council_number)
        if existing is not None and existing.id != current_id:
            raise ValueError("Registro de conselho já cadastrado.")
