from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from e_sus.modules.patients.models import Patient
from e_sus.modules.professional.models import Professional
from e_sus.modules.services.models import MedicalService

from .models import Appointment, AppointmentStatus


class AppointmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def patient_for_user(self, user_id: int):
        from sqlalchemy.orm import joinedload
        return self.db.scalar(select(Patient).options(joinedload(Patient.user)).where(Patient.user_id == user_id))

    def patient(self, patient_id: int):
        return self.db.scalar(select(Patient).options(joinedload(Patient.user)).where(Patient.id == patient_id))

    def professional(self, professional_id: int, lock: bool = False):
        statement = select(Professional).options(selectinload(Professional.services)).where(Professional.id == professional_id)
        if lock:
            statement = statement.with_for_update()
        return self.db.scalar(statement)

    def service(self, service_id: int):
        return self.db.get(MedicalService, service_id)

    def get(self, appointment_id: int, lock: bool = False):
        statement = select(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.professional), joinedload(Appointment.service),
            selectinload(Appointment.history),
        ).where(Appointment.id == appointment_id)
        if lock:
            statement = statement.with_for_update()
        return self.db.scalar(statement)

    def get_by_verification_code(self, code: str):
        statement = select(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.professional), joinedload(Appointment.service),
            selectinload(Appointment.history),
        ).where(Appointment.verification_code == code)
        return self.db.scalar(statement)

    def list(self, *, patient_id: int | None = None, status_value: str | None = None, start: datetime | None = None, end: datetime | None = None):
        statement = select(Appointment).options(
            joinedload(Appointment.patient).joinedload(Patient.user),
            joinedload(Appointment.professional), joinedload(Appointment.service),
        )
        if patient_id is not None:
            statement = statement.where(Appointment.patient_id == patient_id)
        if status_value:
            statement = statement.where(Appointment.status == status_value)
        if start:
            statement = statement.where(Appointment.start_at >= start)
        if end:
            statement = statement.where(Appointment.start_at < end)
        return list(self.db.scalars(statement.order_by(Appointment.start_at)))

    def professional_conflicts(self, professional_id: int, start: datetime, end: datetime, exclude_id: int | None = None):
        statement = select(Appointment).options(joinedload(Appointment.service)).where(
            Appointment.professional_id == professional_id,
            Appointment.status == AppointmentStatus.SCHEDULED.value,
            Appointment.start_at < end,
        )
        if exclude_id is not None:
            statement = statement.where(Appointment.id != exclude_id)
        for existing in self.db.scalars(statement):
            existing_start = self._utc(existing.start_at)
            existing_end = self._utc(existing.end_at) + timedelta(minutes=existing.service.buffer_minutes)
            if existing_start < end and existing_end > start:
                return True
        return False

    def patient_conflicts(self, patient_id: int, start: datetime, end: datetime, exclude_id: int | None = None):
        statement = select(Appointment.id).where(
            Appointment.patient_id == patient_id,
            Appointment.status == AppointmentStatus.SCHEDULED.value,
            Appointment.start_at < end,
            Appointment.end_at > start,
        )
        if exclude_id is not None:
            statement = statement.where(Appointment.id != exclude_id)
        return self.db.scalar(statement.limit(1)) is not None

    @staticmethod
    def _utc(value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
