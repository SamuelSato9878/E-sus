"""allow incomplete patient profiles

Revision ID: d4e8f2a6b901
Revises: a2d9138e7c41
Create Date: 2026-11-13
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d4e8f2a6b901"
down_revision: Union[str, Sequence[str], None] = "a2d9138e7c41"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("patients") as batch_op:
        batch_op.drop_constraint("ck_patient_cpf_length", type_="check")
        batch_op.alter_column("phone", existing_type=sa.String(length=30), nullable=True)
        batch_op.alter_column("cpf", existing_type=sa.String(length=11), nullable=True)
        batch_op.alter_column("birth_date", existing_type=sa.Date(), nullable=True)
        batch_op.create_check_constraint("ck_patient_cpf_length", "cpf IS NULL OR length(cpf) = 11")


def downgrade() -> None:
    bind = op.get_bind()
    incomplete = bind.execute(sa.text("SELECT COUNT(*) FROM patients WHERE phone IS NULL OR cpf IS NULL OR birth_date IS NULL")).scalar_one()
    if incomplete:
        raise RuntimeError("Downgrade blocked until every patient has phone, CPF, and birth date.")
    with op.batch_alter_table("patients") as batch_op:
        batch_op.drop_constraint("ck_patient_cpf_length", type_="check")
        batch_op.alter_column("phone", existing_type=sa.String(length=30), nullable=False)
        batch_op.alter_column("cpf", existing_type=sa.String(length=11), nullable=False)
        batch_op.alter_column("birth_date", existing_type=sa.Date(), nullable=False)
        batch_op.create_check_constraint("ck_patient_cpf_length", "length(cpf) = 11")
