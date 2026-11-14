from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin
from e_sus.modules.users.models import UserRole

from .schemas import ProfessionalCreate, ProfessionalResponse, ProfessionalUpdate
from .service import ProfessionalService

professionals_router = APIRouter(prefix="/professionals", tags=["Professionals"])


def _validation_error(error: ValueError) -> None:
    detail = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=detail) from error


@professionals_router.get("/", response_model=list[ProfessionalResponse])
def list_professionals(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return ProfessionalService(db).list(include_inactive=current_user.role == UserRole.ADMIN)


@professionals_router.post("/", response_model=ProfessionalResponse, status_code=status.HTTP_201_CREATED)
def create_professional(
    data: ProfessionalCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return ProfessionalService(db).create(data)
    except ValueError as error:
        _validation_error(error)


@professionals_router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional(
    professional_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        return ProfessionalService(db).get_by_id(
            professional_id, include_inactive=current_user.role == UserRole.ADMIN
        )
    except ValueError as error:
        _validation_error(error)


@professionals_router.patch("/{professional_id}", response_model=ProfessionalResponse)
def update_professional(
    professional_id: int,
    data: ProfessionalUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return ProfessionalService(db).update(professional_id, data)
    except ValueError as error:
        _validation_error(error)
