from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from e_sus.core.database import Base


class AppointmentStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        CheckConstraint("end_at > start_at", name="ck_appointment_time_order"),
        CheckConstraint("status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')", name="ck_appointment_status"),
        Index("ix_appointment_professional_active_range", "professional_id", "status", "start_at", "end_at"),
        Index("ix_appointment_patient_start", "patient_id", "start_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    verification_code: Mapped[str] = mapped_column(String(12), nullable=False, unique=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="RESTRICT"), nullable=False)
    professional_id: Mapped[int] = mapped_column(ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="RESTRICT"), nullable=False)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default=AppointmentStatus.SCHEDULED.value, server_default=AppointmentStatus.SCHEDULED.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient")
    professional = relationship("Professional")
    service = relationship("MedicalService")
    history: Mapped[list["AppointmentHistory"]] = relationship(back_populates="appointment", order_by="AppointmentHistory.created_at")

    @property
    def patient_name(self) -> str:
        return self.patient.user.user_name

    @property
    def professional_name(self) -> str:
        return self.professional.name

    @property
    def service_name(self) -> str:
        return self.service.name


class AppointmentHistory(Base):
    __tablename__ = "appointment_history"
    __table_args__ = (Index("ix_appointment_history_appointment_created", "appointment_id", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=False)
    action: Mapped[str] = mapped_column(String(20), nullable=False)
    previous_start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    previous_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    new_start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    new_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    previous_status: Mapped[str | None] = mapped_column(String(16))
    new_status: Mapped[str | None] = mapped_column(String(16))
    reason: Mapped[str | None] = mapped_column(String(500))
    changed_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    appointment = relationship("Appointment", back_populates="history")
