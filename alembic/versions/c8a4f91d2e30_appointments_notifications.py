"""add appointments and configurable in-app notifications

Revision ID: c8a4f91d2e30
Revises: 7b2c91a4d6e8
Create Date: 2026-11-10

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8a4f91d2e30"
down_revision: Union[str, Sequence[str], None] = "7b2c91a4d6e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("patient_id", sa.Integer(), sa.ForeignKey("patients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("professional_id", sa.Integer(), sa.ForeignKey("professionals.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=16), server_default="SCHEDULED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("end_at > start_at", name="ck_appointment_time_order"),
        sa.CheckConstraint("status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED')", name="ck_appointment_status"),
    )
    op.create_index("ix_appointment_professional_active_range", "appointments", ["professional_id", "status", "start_at", "end_at"])
    op.create_index("ix_appointment_patient_start", "appointments", ["patient_id", "start_at"])

    op.create_table(
        "appointment_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("appointment_id", sa.Integer(), sa.ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("action", sa.String(length=20), nullable=False),
        sa.Column("previous_start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("previous_end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("new_start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("new_end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("previous_status", sa.String(length=16), nullable=True),
        sa.Column("new_status", sa.String(length=16), nullable=True),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("changed_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_appointment_history_appointment_created", "appointment_history", ["appointment_id", "created_at"])

    op.create_table(
        "notification_rules",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_type", sa.String(length=20), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("title_template", sa.String(length=150), nullable=False),
        sa.Column("body_template", sa.String(length=1000), nullable=False),
        sa.Column("reminder_minutes_before", sa.Integer(), nullable=True),
        sa.Column("updated_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("event_type", name="uq_notification_rule_event"),
        sa.CheckConstraint("event_type IN ('BOOKED', 'CANCELLED', 'RESCHEDULED', 'REMINDER', 'COMPLETED')", name="ck_notification_rule_event"),
        sa.CheckConstraint("reminder_minutes_before IS NULL OR reminder_minutes_before > 0", name="ck_notification_rule_reminder_positive"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("appointment_id", sa.Integer(), sa.ForeignKey("appointments.id", ondelete="RESTRICT"), nullable=True),
        sa.Column("event_type", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("dedupe_key", sa.String(length=180), nullable=False),
        sa.Column("available_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_cancelled", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("dedupe_key", name="uq_notification_dedupe_key"),
        sa.CheckConstraint("event_type IN ('BOOKED', 'CANCELLED', 'RESCHEDULED', 'REMINDER', 'COMPLETED')", name="ck_notification_event"),
    )
    op.create_index("ix_notification_user_available_created", "notifications", ["user_id", "available_at", "created_at"])

    rules = sa.table(
        "notification_rules",
        sa.column("event_type", sa.String()),
        sa.column("is_enabled", sa.Boolean()),
        sa.column("title_template", sa.String()),
        sa.column("body_template", sa.String()),
        sa.column("reminder_minutes_before", sa.Integer()),
    )
    op.bulk_insert(rules, [
        {"event_type": "BOOKED", "is_enabled": True, "title_template": "Consulta agendada", "body_template": "Olá {patient_name}, sua consulta de {service_name} com {professional_name} foi agendada para {date} às {time}.", "reminder_minutes_before": None},
        {"event_type": "CANCELLED", "is_enabled": True, "title_template": "Consulta cancelada", "body_template": "Olá {patient_name}, sua consulta de {service_name} com {professional_name} em {date} às {time} foi cancelada.", "reminder_minutes_before": None},
        {"event_type": "RESCHEDULED", "is_enabled": True, "title_template": "Consulta remarcada", "body_template": "Olá {patient_name}, sua consulta de {service_name} com {professional_name} foi remarcada para {date} às {time}.", "reminder_minutes_before": None},
        {"event_type": "REMINDER", "is_enabled": True, "title_template": "Lembrete de consulta", "body_template": "Olá {patient_name}, você tem consulta de {service_name} com {professional_name} em {date} às {time}.", "reminder_minutes_before": 1440},
        {"event_type": "COMPLETED", "is_enabled": False, "title_template": "Atendimento finalizado", "body_template": "Seu atendimento de {service_name} com {professional_name} em {date} às {time} foi finalizado.", "reminder_minutes_before": None},
    ])


def downgrade() -> None:
    op.drop_index("ix_notification_user_available_created", table_name="notifications")
    op.drop_table("notifications")
    op.drop_table("notification_rules")
    op.drop_index("ix_appointment_history_appointment_created", table_name="appointment_history")
    op.drop_table("appointment_history")
    op.drop_index("ix_appointment_patient_start", table_name="appointments")
    op.drop_index("ix_appointment_professional_active_range", table_name="appointments")
    op.drop_table("appointments")
