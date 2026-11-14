from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from e_sus.modules.appointments.models import Appointment, AppointmentHistory
from e_sus.modules.schedules.schemas import resolve_timezone
from e_sus.modules.schedules.service import ScheduleService

from .models import Notification, NotificationEvent, NotificationRule
from .repository import NotificationRepository
from .schemas import NotificationRuleUpdate


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def list_rules(self):
        return self.repo.rules()

    def update_rule(self, event_type: str, data: NotificationRuleUpdate, user_id: int):
        rule = self.repo.rule(event_type)
        if rule is None:
            raise ValueError("Configuração de notificação não encontrada.")
        changes = data.model_dump(exclude_unset=True)
        if not changes:
            raise ValueError("Informe ao menos uma configuração para atualizar.")
        if event_type != NotificationEvent.REMINDER.value and "reminder_minutes_before" in changes:
            raise ValueError("Antecedência só se aplica à regra REMINDER.")
        if event_type == NotificationEvent.REMINDER.value and changes.get("is_enabled", rule.is_enabled):
            minutes = changes.get("reminder_minutes_before", rule.reminder_minutes_before)
            if minutes is None or minutes < 1:
                raise ValueError("Lembrete ativo exige antecedência em minutos.")
        for field, value in changes.items():
            setattr(rule, field, value)
        rule.updated_by_user_id = user_id
        self.db.commit()
        self.db.refresh(rule)
        return rule

    def inbox(self, user_id: int, unread_only: bool = False):
        return self.repo.inbox(user_id, datetime.now(timezone.utc), unread_only)

    def mark_read(self, user_id: int, notification_id: int):
        notification = self.repo.get_for_user(notification_id, user_id)
        if notification is None:
            raise ValueError("Notificação não encontrada.")
        available_at = notification.available_at.replace(tzinfo=timezone.utc) if notification.available_at.tzinfo is None else notification.available_at
        if available_at > datetime.now(timezone.utc):
            raise ValueError("Notificação ainda não está disponível.")
        if notification.read_at is None:
            notification.read_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(notification)
        return notification

    @staticmethod
    def cancel_pending_reminders(db: Session, appointment_id: int):
        reminders = db.scalars(select(Notification).where(
            Notification.appointment_id == appointment_id,
            Notification.event_type == NotificationEvent.REMINDER.value,
            Notification.is_cancelled.is_(False),
            Notification.read_at.is_(None),
        ))
        for reminder in reminders:
            reminder.is_cancelled = True

    @staticmethod
    def enqueue_for_appointment(db: Session, event_type: NotificationEvent, appointment: Appointment, *, available_at: datetime | None = None) -> Notification | None:
        repository = NotificationRepository(db)
        rule = repository.rule(event_type.value)
        if rule is None or not rule.is_enabled:
            return None
        db.flush()
        history_id = db.scalar(select(func.max(AppointmentHistory.id)).where(AppointmentHistory.appointment_id == appointment.id))
        appointment.patient.user  # ensure related display fields are loaded in the transaction
        start = NotificationService._utc(appointment.start_at)
        schedule_service = ScheduleService(db)
        local_date = schedule_service.local_date_for_datetime(appointment.professional_id, start)
        schedule = schedule_service._schedule_for_date(appointment.professional_id, local_date)
        timezone_name = schedule.timezone_name if schedule else "America/Sao_Paulo"
        dedupe = f"appointment:{appointment.id}:{event_type.value}:history:{history_id or 0}"
        context = {
            "patient_name": appointment.patient.user.user_name,
            "professional_name": appointment.professional.name,
            "service_name": appointment.service.name,
            "date": start.astimezone(resolve_timezone(timezone_name)).strftime("%d/%m/%Y"),
            "time": start.astimezone(resolve_timezone(timezone_name)).strftime("%H:%M"),
        }
        deliver_at = available_at or datetime.now(timezone.utc)
        if event_type == NotificationEvent.REMINDER:
            if rule.reminder_minutes_before is None:
                return None
            deliver_at = start - timedelta(minutes=rule.reminder_minutes_before)
            if deliver_at < datetime.now(timezone.utc):
                deliver_at = datetime.now(timezone.utc)
        notification = Notification(
            user_id=appointment.patient.user_id,
            appointment_id=appointment.id,
            event_type=event_type.value,
            title=rule.title_template.format_map(context),
            body=rule.body_template.format_map(context),
            dedupe_key=dedupe,
            available_at=deliver_at,
        )
        db.add(notification)
        db.flush()
        return notification

    @staticmethod
    def _utc(value: datetime) -> datetime:
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
