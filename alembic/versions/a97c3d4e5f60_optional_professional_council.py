"""make professional council type and number optional

Revision ID: a97c3d4e5f60
Revises: c8a4f91d2e30
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a97c3d4e5f60"
down_revision: Union[str, Sequence[str], None] = "c8a4f91d2e30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("professionals") as batch_op:
        batch_op.alter_column(
            "council_type",
            existing_type=sa.String(length=30),
            nullable=True,
        )
        batch_op.alter_column(
            "council_number",
            existing_type=sa.String(length=50),
            nullable=True,
        )


def downgrade() -> None:
    op.execute(sa.text(
        "UPDATE professionals SET council_type = 'N/A' WHERE council_type IS NULL"
    ))
    op.execute(sa.text(
        "UPDATE professionals SET council_number = 'MIGRATED-' || CAST(id AS VARCHAR) "
        "WHERE council_number IS NULL"
    ))
    with op.batch_alter_table("professionals") as batch_op:
        batch_op.alter_column(
            "council_type",
            existing_type=sa.String(length=30),
            nullable=False,
        )
        batch_op.alter_column(
            "council_number",
            existing_type=sa.String(length=50),
            nullable=False,
        )