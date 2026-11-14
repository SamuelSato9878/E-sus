from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Table, UniqueConstraint, func, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from e_sus.core.database import Base


professional_specialties = Table(
    "professional_specialties",
    Base.metadata,
    Column("professional_id", ForeignKey("professionals.id", ondelete="CASCADE"), primary_key=True),
    Column("specialty_id", ForeignKey("specialties.id", ondelete="RESTRICT"), primary_key=True),
)
Index("ix_professional_specialties_specialty_id", professional_specialties.c.specialty_id)

professional_services = Table(
    "professional_services",
    Base.metadata,
    Column("professional_id", ForeignKey("professionals.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", ForeignKey("services.id", ondelete="RESTRICT"), primary_key=True),
)
Index("ix_professional_services_service_id", professional_services.c.service_id)

class Professional(Base):
    __tablename__ = "professionals"
    __table_args__ = (
        UniqueConstraint(
            "council_type", "council_state", "council_number",
            name="uq_professional_council_registration",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    council_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    council_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    council_state: Mapped[str] = mapped_column(String(2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    specialties = relationship(
        "Specialty", secondary=professional_specialties, back_populates="professionals"
    )
    services = relationship(
        "MedicalService", secondary=professional_services, back_populates="professionals"
    )
    @property
    def specialty_ids(self) -> list[int]:
        return [specialty.id for specialty in self.specialties]

    @property
    def service_ids(self) -> list[int]:
        return [service.id for service in self.services]

