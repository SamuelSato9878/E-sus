from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from e_sus.modules.professional.models import Professional
from e_sus.modules.services.models import MedicalService

from .models import Schedule, ScheduleBlock, ScheduleDay, ScheduleException


class ScheduleRepository:
    def __init__(self, db: Session):
        self.db = db

    def professional(self, professional_id: int):
        return self.db.get(Professional, professional_id)

    def service(self, service_id: int):
        return self.db.get(MedicalService, service_id)

    def get_schedule(self, schedule_id: int):
        return self.db.scalar(select(Schedule).options(selectinload(Schedule.days).selectinload(ScheduleDay.periods)).where(Schedule.id == schedule_id))

    def schedules_for_professional(self, professional_id: int):
        return list(self.db.scalars(select(Schedule).options(selectinload(Schedule.days).selectinload(ScheduleDay.periods)).where(Schedule.professional_id == professional_id).order_by(Schedule.valid_from)))

    def schedules_overlapping(self, professional_id: int, start: date, end: date | None, exclude_id: int | None = None):
        statement = select(Schedule).where(Schedule.professional_id == professional_id, Schedule.is_active.is_(True))
        statement = statement.where(Schedule.valid_from <= (end or date.max))
        if start:
            statement = statement.where((Schedule.valid_until.is_(None)) | (Schedule.valid_until >= start))
        if exclude_id is not None:
            statement = statement.where(Schedule.id != exclude_id)
        return list(self.db.scalars(statement))

    def save(self, entity):
        self.db.add(entity)
        self.db.commit()
        self.db.refresh(entity)
        return entity

    def save_transaction(self, entity):
        self.db.add(entity)
        self.db.flush()
        return entity

    def active_exception(self, professional_id: int, day: date):
        return self.db.scalar(select(ScheduleException).options(selectinload(ScheduleException.periods)).where(ScheduleException.professional_id == professional_id, ScheduleException.exception_date == day, ScheduleException.is_active.is_(True)))

    def exceptions(self, professional_id: int):
        return list(self.db.scalars(select(ScheduleException).options(selectinload(ScheduleException.periods)).where(ScheduleException.professional_id == professional_id).order_by(ScheduleException.exception_date)))

    def blocks(self, professional_id: int, start: datetime, end: datetime):
        return list(self.db.scalars(select(ScheduleBlock).where(ScheduleBlock.professional_id == professional_id, ScheduleBlock.is_active.is_(True), ScheduleBlock.start_at < end, ScheduleBlock.end_at > start)))

    def list_blocks(self, professional_id: int):
        return list(self.db.scalars(select(ScheduleBlock).where(ScheduleBlock.professional_id == professional_id).order_by(ScheduleBlock.start_at)))
