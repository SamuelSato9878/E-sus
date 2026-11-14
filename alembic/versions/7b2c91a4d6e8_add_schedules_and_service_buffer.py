"""add flexible schedules and service buffer

Revision ID: 7b2c91a4d6e8
Revises: f1154d000529
Create Date: 2026-11-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7b2c91a4d6e8"
down_revision: Union[str, Sequence[str], None] = "f1154d000529"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Additive alteration only. The server default backfills existing services with 0.
    buffer_column = sa.Column(
        "buffer_minutes",
        sa.Integer(),
        sa.CheckConstraint("buffer_minutes >= 0", name="ck_service_buffer_nonnegative"),
        server_default="0",
        nullable=False,
    )
    # A single ADD COLUMN with an inline CHECK works on both SQLite and PostgreSQL.
    op.add_column("services", buffer_column)

    op.create_table(
        "schedules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professional_id", sa.Integer(), sa.ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("valid_from", sa.Date(), nullable=False),
        sa.Column("valid_until", sa.Date(), nullable=True),
        sa.Column("timezone_name", sa.String(length=64), server_default="America/Sao_Paulo", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("valid_until IS NULL OR valid_until >= valid_from", name="ck_schedule_valid_range"),
    )
    op.create_index("ix_schedules_professional_id", "schedules", ["professional_id"])
    op.create_index("ix_schedule_professional_active_range", "schedules", ["professional_id", "is_active", "valid_from", "valid_until"])

    op.create_table(
        "schedule_days",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("schedule_id", sa.Integer(), sa.ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.UniqueConstraint("schedule_id", "weekday", name="uq_schedule_day_weekday"),
        sa.CheckConstraint("weekday BETWEEN 0 AND 6", name="ck_schedule_day_weekday"),
    )
    op.create_index("ix_schedule_days_schedule_id", "schedule_days", ["schedule_id"])

    op.create_table(
        "schedule_periods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("schedule_day_id", sa.Integer(), sa.ForeignKey("schedule_days.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.CheckConstraint("start_time < end_time", name="ck_schedule_period_order"),
        sa.UniqueConstraint("schedule_day_id", "start_time", "end_time", name="uq_schedule_period_range"),
    )
    op.create_index("ix_schedule_periods_schedule_day_id", "schedule_periods", ["schedule_day_id"])

    op.create_table(
        "schedule_exceptions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professional_id", sa.Integer(), sa.ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("exception_date", sa.Date(), nullable=False),
        sa.Column("mode", sa.String(length=10), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("professional_id", "exception_date", name="uq_schedule_exception_professional_date"),
        sa.CheckConstraint("mode IN ('CLOSED', 'REPLACE')", name="ck_schedule_exception_mode"),
    )
    op.create_index("ix_schedule_exceptions_professional_id", "schedule_exceptions", ["professional_id"])
    op.create_index("ix_schedule_exceptions_exception_date", "schedule_exceptions", ["exception_date"])

    op.create_table(
        "schedule_exception_periods",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("exception_id", sa.Integer(), sa.ForeignKey("schedule_exceptions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.CheckConstraint("start_time < end_time", name="ck_schedule_exception_period_order"),
        sa.UniqueConstraint("exception_id", "start_time", "end_time", name="uq_schedule_exception_period_range"),
    )
    op.create_index("ix_schedule_exception_periods_exception_id", "schedule_exception_periods", ["exception_id"])

    op.create_table(
        "schedule_blocks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("professional_id", sa.Integer(), sa.ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", sa.String(length=500), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("end_at > start_at", name="ck_schedule_block_order"),
    )
    op.create_index("ix_schedule_blocks_professional_id", "schedule_blocks", ["professional_id"])
    op.create_index("ix_schedule_block_professional_active_range", "schedule_blocks", ["professional_id", "is_active", "start_at", "end_at"])


def downgrade() -> None:
    op.drop_index("ix_schedule_block_professional_active_range", table_name="schedule_blocks")
    op.drop_index("ix_schedule_blocks_professional_id", table_name="schedule_blocks")
    op.drop_table("schedule_blocks")
    op.drop_index("ix_schedule_exception_periods_exception_id", table_name="schedule_exception_periods")
    op.drop_table("schedule_exception_periods")
    op.drop_index("ix_schedule_exceptions_exception_date", table_name="schedule_exceptions")
    op.drop_index("ix_schedule_exceptions_professional_id", table_name="schedule_exceptions")
    op.drop_table("schedule_exceptions")
    op.drop_index("ix_schedule_periods_schedule_day_id", table_name="schedule_periods")
    op.drop_table("schedule_periods")
    op.drop_index("ix_schedule_days_schedule_id", table_name="schedule_days")
    op.drop_table("schedule_days")
    op.drop_index("ix_schedule_professional_active_range", table_name="schedules")
    op.drop_index("ix_schedules_professional_id", table_name="schedules")
    op.drop_table("schedules")
    with op.batch_alter_table("services") as batch_op:
        batch_op.drop_constraint("ck_service_buffer_nonnegative", type_="check")
        batch_op.drop_column("buffer_minutes")
