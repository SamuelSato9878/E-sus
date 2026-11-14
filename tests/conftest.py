from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy import event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from e_sus.core.database import Base, get_db
from e_sus.modules.auth import dependencies as auth_dependencies
from e_sus.modules.auth import service as auth_service
from e_sus.modules.users.models import User, UserRole
from e_sus.modules.patients.models import Patient  # noqa: F401
from e_sus.modules.professional.models import Professional  # noqa: F401
from e_sus.modules.specialties.models import Specialty  # noqa: F401
from e_sus.modules.services.models import MedicalService  # noqa: F401
from e_sus.modules.schedules.models import Schedule, ScheduleDay, SchedulePeriod, ScheduleException, ScheduleExceptionPeriod, ScheduleBlock  # noqa: F401
from e_sus.modules.appointments.models import Appointment, AppointmentHistory  # noqa: F401
from e_sus.modules.notificatons.models import Notification, NotificationRule  # noqa: F401
from e_sus.modules.notificatons.models import NotificationEvent
from e_sus.server.server import app


class FakeSupabaseAuthProvider:
    users_by_token = {}

    def sign_up(self, email: str, password: str, user_name: str):
        user = SimpleNamespace(id="supabase-new-user", email=email)
        session = SimpleNamespace(access_token="signup-access", refresh_token="signup-refresh")
        return SimpleNamespace(user=user, session=session)

    signed_out = []

    def sign_in(self, email: str, password: str):
        if password != "secret":
            error = ValueError("invalid credentials")
            error.status = 400
            raise error
        user_id = "supabase-unlinked" if email == "unlinked@example.com" else "supabase-patient"
        user = SimpleNamespace(id=user_id, email=email)
        session = SimpleNamespace(access_token="login-access", refresh_token="login-refresh")
        return SimpleNamespace(user=user, session=session)

    def refresh_session(self, refresh_token: str):
        if refresh_token in {"invalid-refresh", "temporary-refresh-error"}:
            error = ValueError("provider error")
            error.status = 503 if refresh_token == "temporary-refresh-error" else 400
            raise error
        session = SimpleNamespace(access_token="new-access", refresh_token="new-refresh")
        return SimpleNamespace(session=session)

    def sign_out(self, access_token: str):
        self.signed_out.append(access_token)

    def request_password_recovery(self, email: str, redirect_to: str):
        return None

    def update_password(self, access_token: str, refresh_token: str, password: str):
        return None

    def get_user(self, access_token: str):
        if access_token == "provider-unavailable":
            error = ValueError("temporary provider failure")
            error.status = 503
            raise error
        user = self.users_by_token.get(access_token)
        if user is None:
            error = ValueError("invalid token")
            error.status = 401
            raise error
        return SimpleNamespace(user=user)


@pytest.fixture
def client(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    default_rules = [
        NotificationRule(event_type=NotificationEvent.BOOKED.value, is_enabled=True, title_template="Consulta agendada", body_template="Olá {patient_name}, sua consulta de {service_name} com {professional_name} foi agendada para {date} às {time}."),
        NotificationRule(event_type=NotificationEvent.CANCELLED.value, is_enabled=True, title_template="Consulta cancelada", body_template="Olá {patient_name}, sua consulta de {service_name} com {professional_name} em {date} às {time} foi cancelada."),
        NotificationRule(event_type=NotificationEvent.RESCHEDULED.value, is_enabled=True, title_template="Consulta remarcada", body_template="Olá {patient_name}, sua consulta de {service_name} com {professional_name} foi remarcada para {date} às {time}."),
        NotificationRule(event_type=NotificationEvent.REMINDER.value, is_enabled=True, title_template="Lembrete de consulta", body_template="Olá {patient_name}, você tem consulta de {service_name} com {professional_name} em {date} às {time}.", reminder_minutes_before=1440),
        NotificationRule(event_type=NotificationEvent.COMPLETED.value, is_enabled=False, title_template="Atendimento finalizado", body_template="Seu atendimento de {service_name} com {professional_name} em {date} às {time} foi finalizado."),
    ]
    with TestingSessionLocal() as initial_session:
        initial_session.add_all(default_rules)
        initial_session.commit()
    FakeSupabaseAuthProvider.users_by_token = {}
    FakeSupabaseAuthProvider.signed_out = []

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr(auth_service, "SupabaseAuthProvider", FakeSupabaseAuthProvider)
    monkeypatch.setattr(auth_dependencies, "SupabaseAuthProvider", FakeSupabaseAuthProvider)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        test_client.testing_session_factory = TestingSessionLocal
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def seeded_users(client):
    db = client.testing_session_factory()
    patient = User(
        user_name="Paciente Teste",
        email="patient@example.com",
        supabase_user_id="supabase-patient",
        role=UserRole.PATIENT,
    )
    admin = User(
        user_name="Admin Teste",
        email="admin@example.com",
        supabase_user_id="supabase-admin",
        role=UserRole.ADMIN,
    )
    db.add_all([patient, admin])
    db.commit()
    db.refresh(patient)
    db.refresh(admin)
    FakeSupabaseAuthProvider.users_by_token.update(
        {
            "patient-token": SimpleNamespace(id=patient.supabase_user_id, email=patient.email),
            "admin-token": SimpleNamespace(id=admin.supabase_user_id, email=admin.email),
        }
    )
    result = {"patient_id": patient.id, "admin_id": admin.id}
    db.close()
    return result
