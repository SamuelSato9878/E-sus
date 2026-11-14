from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin
from e_sus.modules.users.models import User

from .schemas import AppointmentCancel, AppointmentCreate, AppointmentDetail, AppointmentReschedule, AppointmentResponse
from .service import AppointmentService

appointments_router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _handle(error: ValueError):
    detail = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrad" in detail.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=detail) from error


@appointments_router.post("/", response_model=AppointmentResponse, status_code=201)
def create_appointment(data: AppointmentCreate, actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).create(actor, data)
    except ValueError as exc:
        _handle(exc)


@appointments_router.get("/me/upcoming", response_model=list[AppointmentResponse])
def upcoming(actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from e_sus.modules.users.models import UserRole
    if actor.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Endpoint disponível para pacientes.")
    try:
        return AppointmentService(db).upcoming(actor)
    except ValueError as exc:
        _handle(exc)


@appointments_router.get("/me/history", response_model=list[AppointmentResponse])
def history(actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from e_sus.modules.users.models import UserRole
    if actor.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Endpoint disponível para pacientes.")
    try:
        return AppointmentService(db).history(actor)
    except ValueError as exc:
        _handle(exc)


@appointments_router.get("/", response_model=list[AppointmentResponse])
def list_appointments(
    status_filter: Literal["SCHEDULED", "CANCELLED", "COMPLETED"] | None = Query(default=None, alias="status"),
    start: date | None = None,
    end: date | None = None,
    actor: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if start and end and end < start:
        raise HTTPException(status_code=422, detail="Data final deve ser igual ou posterior à inicial.")
    try:
        return AppointmentService(db).list(actor, status_filter, start, end)
    except ValueError as exc:
        _handle(exc)


@appointments_router.get("/verify/{code}", response_model=AppointmentResponse, dependencies=[Depends(require_admin)])
def verify_appointment(code: str, db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).verify(code)
    except ValueError as exc:
        _handle(exc)


@appointments_router.get("/{appointment_id}", response_model=AppointmentDetail)
def get_appointment(appointment_id: int, actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).get(appointment_id, actor)
    except ValueError as exc:
        _handle(exc)


@appointments_router.post("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(appointment_id: int, data: AppointmentCancel, actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).cancel(appointment_id, actor, data.reason)
    except ValueError as exc:
        _handle(exc)


@appointments_router.post("/{appointment_id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(appointment_id: int, data: AppointmentReschedule, actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).reschedule(appointment_id, actor, data)
    except ValueError as exc:
        _handle(exc)


@appointments_router.post("/{appointment_id}/complete", response_model=AppointmentResponse, dependencies=[Depends(require_admin)])
def complete_appointment(appointment_id: int, actor: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return AppointmentService(db).complete(appointment_id, actor)
    except ValueError as exc:
        _handle(exc)
