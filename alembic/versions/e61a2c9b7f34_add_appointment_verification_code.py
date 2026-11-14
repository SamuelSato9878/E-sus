"""add unique verification code to appointments

Revision ID: e61a2c9b7f34
Revises: d4e8f2a6b901
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "e61a2c9b7f34"
down_revision: Union[str, Sequence[str], None] = "d4e8f2a6b901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "verification_code" not in {column["name"] for column in inspector.get_columns("appointments")}:
        op.add_column("appointments", sa.Column("verification_code", sa.String(length=12), nullable=True))
    appointments = sa.table("appointments", sa.column("id", sa.Integer()), sa.column("verification_code", sa.String(length=12)))
    connection = op.get_bind()
    for (appointment_id,) in connection.execute(
        sa.select(appointments.c.id).where(appointments.c.verification_code.is_(None))
    ):
        connection.execute(
            appointments.update()
            .where(appointments.c.id == appointment_id)
            .values(verification_code=uuid4().hex[:12].upper())
        )
    indexes = {index["name"] for index in sa.inspect(connection).get_indexes("appointments")}
    if "ix_appointments_verification_code" not in indexes:
        op.create_index("ix_appointments_verification_code", "appointments", ["verification_code"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_appointments_verification_code", table_name="appointments")
    op.drop_column("appointments", "verification_code")
