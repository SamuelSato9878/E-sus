"""remove service price

Revision ID: f1154d000529
Revises: 4faa2f2ee706
Create Date: 2026-11-10 16:56:10.525868

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1154d000529'
down_revision: Union[str, Sequence[str], None] = '4faa2f2ee706'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Batch mode rebuilds the table on SQLite and uses ALTER TABLE on PostgreSQL.
    with op.batch_alter_table("services") as batch_op:
        batch_op.drop_constraint("ck_service_price_nonnegative", type_="check")
        batch_op.drop_column("price")


def downgrade() -> None:
    """Restore the nullable price column (previous price values cannot be recovered)."""
    with op.batch_alter_table("services") as batch_op:
        batch_op.add_column(sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=True))
        batch_op.create_check_constraint(
            "ck_service_price_nonnegative", "price IS NULL OR price >= 0"
        )
