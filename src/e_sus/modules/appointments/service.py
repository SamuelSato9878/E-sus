from datetime import date, datetime, timedelta, timezone
from secrets import token_hex

from sqlalchemy.orm import Session

from e_sus.modules.notificatons.models import NotificationEvent
from e_sus.modules.notificatons.service import NotificationService
from e_sus.modules.patients.models import Patient
from e_sus.modules.schedules.service import ScheduleService
from e_sus.modules.users.models import User, UserRole

from .models import Appointment, AppointmentHistory, AppointmentStatus
from .repository import AppointmentRepository
from .schemas import AppointmentCreate, AppointmentReschedule


class AppointmentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AppointmentRepository(db)
        self.schedule_service = ScheduleService(db)

    def create(self, actor: User, data: AppointmentCreate):
        patient = self._resolve_patient(actor, data.patient_id)
        professional = self.repo.professional(data.professional_id, lock=True)
        if professional is None or not professional.is_active:
            raise ValueError("Profissional ativo não encontrado.")
        service = self.repo.service(data.service_id)
        if service is None or not service.is_active:
            raise ValueError("Serviço ativo não encontrado.")
        if not any(item.id == service.id for item in professional.services):
            raise ValueError("Serviço não habilitado para este profissional.")
        start = self._utc(data.start_at)
        now = datetime.now(timezone.utc)
        if start <= now:
            raise ValueError("Não é possível agendar em data passada.")
        start_local_date = self.schedule_service.local_date_for_datetime(professional.id, start)
        end = start + timedelta(minutes=service.duration_minutes)
        self._validate_availability(professional.id, service.id, start, start_local_date)
        self._assert_no_conflicts(patient.id, professional.id, start, end, service.buffer_minutes)
        appointment = Appointment(
            patient=patient, professional=professional, service=service,
            verification_code=token_hex(6).upper(),
            start_at=start, end_at=end, status=AppointmentStatus.SCHEDULED.value,
        )
        try:
            self.db.add(appointment)
            self.db.flush()
            self._history(appointment, actor, "CREATED", None, new_status=appointment.status, new_start=appointment.start_at, new_end=appointment.end_at)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.BOOKED, appointment)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.REMINDER, appointment)
            self.db.commit()
            return self.repo.get(appointment.id)
        except Exception:
            self.db.rollback()
            raise

    def list(self, actor: User, status_value: str | None = None, start: date | None = None, end: date | None = None):
        patient_id = None
        if actor.role == UserRole.PATIENT:
            patient = self.repo.patient_for_user(actor.id)
            if patient is None:
                raise ValueError("Perfil de paciente não encontrado.")
            patient_id = patient.id
        start_at = datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc) if start else None
        end_at = datetime.combine(end + timedelta(days=1), datetime.min.time(), tzinfo=timezone.utc) if end else None
        return self.repo.list(patient_id=patient_id, status_value=status_value, start=start_at, end=end_at)

    def upcoming(self, actor: User):
        patient = self._patient_for_actor(actor)
        return self.repo.list(patient_id=patient.id, status_value=AppointmentStatus.SCHEDULED.value, start=datetime.now(timezone.utc))

    def history(self, actor: User):
        patient = self._patient_for_actor(actor)
        items = self.repo.list(patient_id=patient.id)
        now = datetime.now(timezone.utc)
        return [item for item in items if item.status != AppointmentStatus.SCHEDULED.value or self._utc(item.start_at) < now]

    def get(self, appointment_id: int, actor: User):
        appointment = self.repo.get(appointment_id)
        if appointment is None:
            raise ValueError("Consulta não encontrada.")
        if actor.role == UserRole.PATIENT:
            patient = self._patient_for_actor(actor)
            if appointment.patient_id != patient.id:
                raise ValueError("Consulta não encontrada.")
        return appointment

    def verify(self, code: str):
        appointment = self.repo.get_by_verification_code(code.upper())
        if appointment is None:
            raise ValueError("Consulta não encontrada.")
        return appointment

    def cancel(self, appointment_id: int, actor: User, reason: str | None = None):
        appointment = self.repo.get(appointment_id, lock=True)
        self._ensure_access(appointment, actor)
        if appointment.status != AppointmentStatus.SCHEDULED.value:
            raise ValueError("Somente consultas agendadas podem ser canceladas.")
        now = datetime.now(timezone.utc)
        if actor.role == UserRole.PATIENT and self._utc(appointment.start_at) <= now:
            raise ValueError("Paciente só pode cancelar consulta futura.")
        try:
            old_status = appointment.status
            appointment.status = AppointmentStatus.CANCELLED.value
            NotificationService.cancel_pending_reminders(self.db, appointment.id)
            self._history(appointment, actor, "CANCELLED", old_status, old_start=appointment.start_at, old_end=appointment.end_at, reason=reason)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.CANCELLED, appointment)
            self.db.commit()
            return self.repo.get(appointment_id)
        except Exception:
            self.db.rollback()
            raise

    def reschedule(self, appointment_id: int, actor: User, data: AppointmentReschedule):
        appointment = self.repo.get(appointment_id, lock=True)
        self._ensure_access(appointment, actor)
        if appointment.status != AppointmentStatus.SCHEDULED.value:
            raise ValueError("Somente consultas agendadas podem ser remarcadas.")
        old_start, old_end = appointment.start_at, appointment.end_at
        now = datetime.now(timezone.utc)
        if actor.role == UserRole.PATIENT and self._utc(old_start) <= now:
            raise ValueError("Paciente só pode remarcar consulta futura.")
        start = self._utc(data.start_at)
        if start <= now:
            raise ValueError("Não é possível remarcar para uma data passada.")
        start_date = self.schedule_service.local_date_for_datetime(appointment.professional_id, start)
        duration = appointment.service.duration_minutes
        end = start + timedelta(minutes=duration)
        self._validate_availability(appointment.professional_id, appointment.service_id, start, start_date)
        self._assert_no_conflicts(appointment.patient_id, appointment.professional_id, start, end, appointment.service.buffer_minutes, exclude_id=appointment.id)
        try:
            appointment.start_at = start
            appointment.end_at = end
            NotificationService.cancel_pending_reminders(self.db, appointment.id)
            self._history(appointment, actor, "RESCHEDULED", appointment.status, new_start=start, new_end=end, old_start=old_start, old_end=old_end, reason=data.reason)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.RESCHEDULED, appointment)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.REMINDER, appointment)
            self.db.commit()
            return self.repo.get(appointment_id)
        except Exception:
            self.db.rollback()
            raise

    def complete(self, appointment_id: int, actor: User):
        appointment = self.repo.get(appointment_id, lock=True)
        if appointment is None:
            raise ValueError("Consulta não encontrada.")
        if actor.role != UserRole.ADMIN:
            raise ValueError("Somente ADMIN pode finalizar consultas.")
        if appointment.status != AppointmentStatus.SCHEDULED.value:
            raise ValueError("Somente consultas agendadas podem ser finalizadas.")
        if self._utc(appointment.start_at) > datetime.now(timezone.utc):
            raise ValueError("Consulta futura não pode ser finalizada.")
        try:
            old_status = appointment.status
            appointment.status = AppointmentStatus.COMPLETED.value
            NotificationService.cancel_pending_reminders(self.db, appointment.id)
            self._history(appointment, actor, "COMPLETED", old_status, old_start=appointment.start_at, old_end=appointment.end_at)
            NotificationService.enqueue_for_appointment(self.db, NotificationEvent.COMPLETED, appointment)
            self.db.commit()
            return self.repo.get(appointment_id)
        except Exception:
            self.db.rollback()
            raise

    def _validate_availability(self, professional_id: int, service_id: int, start: datetime, day: date):
        availability = self.schedule_service.availability(professional_id, service_id, day)
        if not any(self._utc(window["start_at"]) <= start <= self._utc(window["end_at"]) for window in availability["windows"]):
            raise ValueError("Horário não está disponível para reserva.")

    def _assert_no_conflicts(self, patient_id, professional_id, start, end, buffer_minutes, exclude_id=None):
        occupied_end = end + timedelta(minutes=buffer_minutes)
        if self.repo.professional_conflicts(professional_id, start, occupied_end, exclude_id):
            raise ValueError("Profissional já possui consulta nesse período.")
        if self.repo.patient_conflicts(patient_id, start, end, exclude_id):
            raise ValueError("Paciente já possui consulta nesse período.")

    def _resolve_patient(self, actor: User, requested_id: int | None) -> Patient:
        if actor.role == UserRole.PATIENT:
            if requested_id is not None:
                raise ValueError("Paciente não pode informar outro perfil de paciente.")
            patient = self.repo.patient_for_user(actor.id)
        elif actor.role == UserRole.ADMIN:
            if requested_id is None:
                raise ValueError("ADMIN deve informar o paciente da consulta.")
            patient = self.repo.patient(requested_id)
        else:
            patient = None
        if patient is None or not patient.is_active:
            raise ValueError("Paciente ativo não encontrado.")
        return patient

    def _patient_for_actor(self, actor: User) -> Patient:
        patient = self.repo.patient_for_user(actor.id)
        if patient is None:
            raise ValueError("Perfil de paciente não encontrado.")
        return patient

    def _ensure_access(self, appointment: Appointment | None, actor: User):
        if appointment is None:
            raise ValueError("Consulta não encontrada.")
        if actor.role == UserRole.PATIENT and appointment.patient_id != self._patient_for_actor(actor).id:
            raise ValueError("Consulta não encontrada.")

    def _history(self, appointment, actor, action, old_status, new_status=None, old_start=None, old_end=None, new_start=None, new_end=None, reason=None):
        self.db.add(AppointmentHistory(
            appointment=appointment, action=action, previous_status=old_status,
            new_status=new_status or appointment.status, previous_start_at=old_start,
            previous_end_at=old_end, new_start_at=new_start or appointment.start_at,
            new_end_at=new_end or appointment.end_at, reason=reason,
            changed_by_user_id=actor.id,
        ))

    @staticmethod
    def _utc(value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
