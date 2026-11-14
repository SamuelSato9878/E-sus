from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin
from e_sus.modules.users.models import UserRole

from .schemas import ServiceCreate, ServiceResponse, ServiceUpdate
from .service import MedicalServiceService

services_router = APIRouter(prefix="/services", tags=["Services"])


def _validation_error(error: ValueError) -> None:
    detail = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=detail) from error


@services_router.get("/", response_model=list[ServiceResponse])
def list_services(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return MedicalServiceService(db).list(include_inactive=current_user.role == UserRole.ADMIN)


@services_router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    data: ServiceCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)
):
    try:
        return MedicalServiceService(db).create(data)
    except ValueError as error:
        _validation_error(error)


@services_router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return MedicalServiceService(db).get_by_id(
            service_id, include_inactive=current_user.role == UserRole.ADMIN
        )
    except ValueError as error:
        _validation_error(error)


@services_router.patch("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    data: ServiceUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return MedicalServiceService(db).update(service_id, data)
    except ValueError as error:
        _validation_error(error)
