from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint, false, func, true
from sqlalchemy.orm import Mapped, mapped_column

from e_sus.core.database import Base


class NotificationEvent(str, Enum):
    BOOKED = "BOOKED"
    CANCELLED = "CANCELLED"
    RESCHEDULED = "RESCHEDULED"
    REMINDER = "REMINDER"
    COMPLETED = "COMPLETED"


class NotificationRule(Base):
    __tablename__ = "notification_rules"
    __table_args__ = (
        UniqueConstraint("event_type", name="uq_notification_rule_event"),
        CheckConstraint("event_type IN ('BOOKED', 'CANCELLED', 'RESCHEDULED', 'REMINDER', 'COMPLETED')", name="ck_notification_rule_event"),
        CheckConstraint("reminder_minutes_before IS NULL OR reminder_minutes_before > 0", name="ck_notification_rule_reminder_positive"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    title_template: Mapped[str] = mapped_column(String(150), nullable=False)
    body_template: Mapped[str] = mapped_column(String(1000), nullable=False)
    reminder_minutes_before: Mapped[int | None] = mapped_column(Integer)
    updated_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("dedupe_key", name="uq_notification_dedupe_key"),
        CheckConstraint("event_type IN ('BOOKED', 'CANCELLED', 'RESCHEDULED', 'REMINDER', 'COMPLETED')", name="ck_notification_event"),
        Index("ix_notification_user_available_created", "user_id", "available_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id", ondelete="RESTRICT"))
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    dedupe_key: Mapped[str] = mapped_column(String(180), nullable=False)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_cancelled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=false())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
