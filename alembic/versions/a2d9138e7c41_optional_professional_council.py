"""make professional phone optional

Revision ID: a2d9138e7c41
Revises: a97c3d4e5f60
Create Date: 2026-11-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a2d9138e7c41"
down_revision: Union[str, Sequence[str], None] = "a97c3d4e5f60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing phone values and all constraints are preserved.
    with op.batch_alter_table("professionals") as batch_op:
        batch_op.alter_column(
            "phone",
            existing_type=sa.String(length=30),
            nullable=True,
        )


def downgrade() -> None:
    bind = op.get_bind()
    null_registrations = bind.execute(
        sa.text(
            "SELECT COUNT(*) FROM professionals WHERE phone IS NULL"
        )
    ).scalar_one()
    if null_registrations:
        raise RuntimeError(
            "Downgrade bloqueado: preencha phone em todos os profissionais "
            "antes de tornar o campo obrigatório."
        )

    with op.batch_alter_table("professionals") as batch_op:
        batch_op.alter_column(
            "phone",
            existing_type=sa.String(length=30),
            nullable=False,
        )
