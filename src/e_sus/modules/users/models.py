from enum import Enum

from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column


from e_sus.core.database import Base


from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class UserRole(str, Enum):
    PATIENT = "Paciente"
    PROFESSIONAL = "Profissional de Saúde"
    ADMIN = "Admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )
    
    supabase_user_id: Mapped[str] = mapped_column(
        String(36),
        unique=True,
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True
    )

    role: Mapped[UserRole] = mapped_column(
        default=UserRole.PATIENT,
        nullable=False
    )