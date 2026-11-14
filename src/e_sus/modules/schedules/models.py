


from datetime import date, datetime, time

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Index, Integer, String, Time, UniqueConstraint, func, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from e_sus.core.database import Base


class Schedule(Base):
    __tablename__ = "schedules"
    __table_args__ = (
        CheckConstraint("valid_until IS NULL OR valid_until >= valid_from", name="ck_schedule_valid_range"),
        Index("ix_schedule_professional_active_range", "professional_id", "is_active", "valid_from", "valid_until"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False, index=True)
    valid_from: Mapped[date] = mapped_column(Date, nullable=False)
    valid_until: Mapped[date | None] = mapped_column(Date)
    timezone_name: Mapped[str] = mapped_column(String(64), nullable=False, default="America/Sao_Paulo", server_default="America/Sao_Paulo")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    professional = relationship("Professional")
    days: Mapped[list["ScheduleDay"]] = relationship(back_populates="schedule", cascade="all, delete-orphan")


class ScheduleDay(Base):
    __tablename__ = "schedule_days"
    __table_args__ = (UniqueConstraint("schedule_id", "weekday", name="uq_schedule_day_weekday"), CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_schedule_day_weekday"))

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False, index=True)
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    schedule: Mapped[Schedule] = relationship(back_populates="days")
    periods: Mapped[list["SchedulePeriod"]] = relationship(cascade="all, delete-orphan")


class SchedulePeriod(Base):
    __tablename__ = "schedule_periods"
    __table_args__ = (CheckConstraint("start_time < end_time", name="ck_schedule_period_order"), UniqueConstraint("schedule_day_id", "start_time", "end_time", name="uq_schedule_period_range"))

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_day_id: Mapped[int] = mapped_column(ForeignKey("schedule_days.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)


class ScheduleException(Base):
    __tablename__ = "schedule_exceptions"
    __table_args__ = (UniqueConstraint("professional_id", "exception_date", name="uq_schedule_exception_professional_date"), CheckConstraint("mode IN ('CLOSED', 'REPLACE')", name="ck_schedule_exception_mode"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False, index=True)
    exception_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    mode: Mapped[str] = mapped_column(String(10), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    professional = relationship("Professional")
    periods: Mapped[list["ScheduleExceptionPeriod"]] = relationship(cascade="all, delete-orphan")


class ScheduleExceptionPeriod(Base):
    __tablename__ = "schedule_exception_periods"
    __table_args__ = (CheckConstraint("start_time < end_time", name="ck_schedule_exception_period_order"), UniqueConstraint("exception_id", "start_time", "end_time", name="uq_schedule_exception_period_range"))

    id: Mapped[int] = mapped_column(primary_key=True)
    exception_id: Mapped[int] = mapped_column(ForeignKey("schedule_exceptions.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)


class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"
    __table_args__ = (CheckConstraint("end_at > start_at", name="ck_schedule_block_order"), Index("ix_schedule_block_professional_active_range", "professional_id", "is_active", "start_at", "end_at"))

    id: Mapped[int] = mapped_column(primary_key=True)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    professional = relationship("Professional")

