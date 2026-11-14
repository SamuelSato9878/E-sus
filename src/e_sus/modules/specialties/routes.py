from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin
from e_sus.modules.users.models import UserRole

from .schemas import SpecialtyCreate, SpecialtyResponse, SpecialtyUpdate
from .service import SpecialtyService

specialties_router = APIRouter(prefix="/specialties", tags=["Specialties"])


def _validation_error(error: ValueError) -> None:
    detail = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=detail) from error


@specialties_router.get("/", response_model=list[SpecialtyResponse])
def list_specialties(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return SpecialtyService(db).list(include_inactive=current_user.role == UserRole.ADMIN)


@specialties_router.post("/", response_model=SpecialtyResponse, status_code=status.HTTP_201_CREATED)
def create_specialty(
    data: SpecialtyCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return SpecialtyService(db).create(data)
    except ValueError as error:
        _validation_error(error)


@specialties_router.get("/{specialty_id}", response_model=SpecialtyResponse)
def get_specialty(
    specialty_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        return SpecialtyService(db).get_by_id(
            specialty_id, include_inactive=current_user.role == UserRole.ADMIN
        )
    except ValueError as error:
        _validation_error(error)


@specialties_router.patch("/{specialty_id}", response_model=SpecialtyResponse)
def update_specialty(
    specialty_id: int,
    data: SpecialtyUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return SpecialtyService(db).update(specialty_id, data)
    except ValueError as error:
        _validation_error(error)
