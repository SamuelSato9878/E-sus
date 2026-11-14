from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin, require_patient
from e_sus.modules.users.models import User

from .schemas import (
    PatientAdminCreate,
    PatientAdminUpdate,
    PatientResponse,
    PatientSelfCreate,
    PatientSelfUpdate,
)
from .service import PatientService

patients_router = APIRouter(prefix="/patients", tags=["Patients"])


def _raise_validation(error: ValueError) -> None:
    detail = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=detail) from error


@patients_router.post("/me", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_own_profile(
    data: PatientSelfCreate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    try:
        return PatientService(db).create(current_user.id, data)
    except ValueError as error:
        _raise_validation(error)


@patients_router.get("/me", response_model=PatientResponse)
def get_own_profile(current_user: User = Depends(require_patient), db: Session = Depends(get_db)):
    try:
        return PatientService(db).get_by_user_id(current_user.id)
    except ValueError as error:
        _raise_validation(error)


@patients_router.patch("/me", response_model=PatientResponse)
def update_own_profile(
    data: PatientSelfUpdate,
    current_user: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    try:
        return PatientService(db).update_own(current_user.id, data)
    except ValueError as error:
        _raise_validation(error)


@patients_router.get("/", response_model=list[PatientResponse], dependencies=[Depends(require_admin)])
def list_patients(db: Session = Depends(get_db)):
    return PatientService(db).list()


@patients_router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientAdminCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return PatientService(db).create(data.user_id, data)
    except ValueError as error:
        _raise_validation(error)


@patients_router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return PatientService(db).get_by_id(patient_id)
    except ValueError as error:
        _raise_validation(error)


@patients_router.patch("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    data: PatientAdminUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    try:
        return PatientService(db).update(patient_id, data)
    except ValueError as error:
        _raise_validation(error)
