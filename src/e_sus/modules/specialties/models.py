from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, UniqueConstraint, func, true
from sqlalchemy.orm import Mapped, mapped_column, relationship

from e_sus.core.database import Base
from e_sus.modules.professional.models import professional_specialties


class Specialty(Base):
    __tablename__ = "specialties"
    __table_args__ = (UniqueConstraint("name", name="uq_specialty_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=true())
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    professionals = relationship(
        "Professional", secondary=professional_specialties, back_populates="specialties"
    )

    @property
    def professional_ids(self) -> list[int]:
        return [professional.id for professional in self.professionals]
