from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from e_sus.core.database import get_db
from e_sus.modules.auth.dependencies import get_current_user, require_admin

from .schemas import AvailabilityResponse, BlockCreate, BlockUpdate, CopyDaysRequest, ExceptionCreate, ExceptionUpdate, ReplicateScheduleRequest, ScheduleBlockResponse, ScheduleCreate, ScheduleDayInput, ScheduleExceptionResponse, ScheduleResponse, ScheduleUpdate
from .service import ScheduleService

schedules_router = APIRouter(tags=["Schedules"])


def _handle(error: ValueError):
    text = str(error)
    code = status.HTTP_404_NOT_FOUND if "não encontrado" in text.lower() else status.HTTP_409_CONFLICT
    raise HTTPException(status_code=code, detail=text) from error


@schedules_router.post("/professionals/{professional_id}/schedules", response_model=ScheduleResponse, status_code=201)
def create_schedule(professional_id: int, data: ScheduleCreate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).create_schedule(professional_id, data)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/professionals/{professional_id}/schedules", response_model=list[ScheduleResponse])
def list_schedules(professional_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).list_schedules(professional_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).get_schedule(schedule_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.patch("/schedules/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(schedule_id: int, data: ScheduleUpdate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).update_schedule(schedule_id, data)
    except ValueError as exc:
        _handle(exc)


@schedules_router.put("/schedules/{schedule_id}/days/{weekday}", response_model=ScheduleResponse)
def set_day(schedule_id: int, weekday: int, data: ScheduleDayInput, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).set_day(schedule_id, weekday, data)
    except ValueError as exc:
        _handle(exc)


@schedules_router.post("/schedules/{schedule_id}/copy-days", response_model=ScheduleResponse)
def copy_days(schedule_id: int, data: CopyDaysRequest, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).copy_days(schedule_id, data.source_weekday, data.target_weekdays)
    except ValueError as exc:
        _handle(exc)


@schedules_router.post("/schedules/{schedule_id}/copy-to-professionals", response_model=list[ScheduleResponse], status_code=201)
def replicate_schedule(schedule_id: int, data: ReplicateScheduleRequest, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).replicate(schedule_id, data.professional_ids)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/professionals/{professional_id}/schedule-exceptions", response_model=list[ScheduleExceptionResponse])
def list_exceptions(professional_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).list_exceptions(professional_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.post("/professionals/{professional_id}/schedule-exceptions", response_model=ScheduleExceptionResponse, status_code=201)
def create_exception(professional_id: int, data: ExceptionCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).create_exception(professional_id, data, admin)
    except ValueError as exc:
        _handle(exc)


@schedules_router.delete("/schedule-exceptions/{exception_id}", response_model=ScheduleExceptionResponse)
def deactivate_exception(exception_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).deactivate_exception(exception_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.patch("/schedule-exceptions/{exception_id}", response_model=ScheduleExceptionResponse)
def update_exception(exception_id: int, data: ExceptionUpdate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).update_exception(exception_id, data)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/professionals/{professional_id}/schedule-blocks", response_model=list[ScheduleBlockResponse])
def list_blocks(professional_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).list_blocks(professional_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.post("/professionals/{professional_id}/schedule-blocks", response_model=ScheduleBlockResponse, status_code=201)
def create_block(professional_id: int, data: BlockCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).create_block(professional_id, data, admin)
    except ValueError as exc:
        _handle(exc)


@schedules_router.delete("/schedule-blocks/{block_id}", response_model=ScheduleBlockResponse)
def deactivate_block(block_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).deactivate_block(block_id)
    except ValueError as exc:
        _handle(exc)


@schedules_router.patch("/schedule-blocks/{block_id}", response_model=ScheduleBlockResponse)
def update_block(block_id: int, data: BlockUpdate, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).update_block(block_id, data)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/availability/days", response_model=list[date])
def available_days(professional_id: int, service_id: int, start: date, end: date, _user=Depends(get_current_user), db: Session = Depends(get_db)):
    if end < start or (end - start).days > 366:
        raise HTTPException(status_code=422, detail="Intervalo de consulta inválido (máximo de 366 dias).")
    try:
        return ScheduleService(db).availability_days(professional_id, service_id, start, end)
    except ValueError as exc:
        _handle(exc)


@schedules_router.get("/availability/windows", response_model=AvailabilityResponse)
def available_windows(professional_id: int, service_id: int, day: date = Query(alias="date"), _user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return ScheduleService(db).availability(professional_id, service_id, day)
    except ValueError as exc:
        _handle(exc)

