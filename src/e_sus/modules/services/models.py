from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from e_sus.core.database import Base
from e_sus.modules.professional.models import professional_services


class MedicalService(Base):
    __tablename__ = "services"
    __table_args__ = (
        UniqueConstraint("specialty_id", "name", name="uq_service_specialty_name"),
        CheckConstraint("duration_minutes > 0", name="ck_service_duration_positive"),
        CheckConstraint("buffer_minutes >= 0", name="ck_service_buffer_nonnegative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000))
    duration_minutes: Mapped[int] = mapped_column(nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")
    specialty_id: Mapped[int] = mapped_column(
        ForeignKey("specialties.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    specialty = relationship("Specialty")
    professionals = relationship(
        "Professional", secondary=professional_services, back_populates="services"
    )

    @property
    def professional_ids(self) -> list[int]:
        return [professional.id for professional in self.professionals]
