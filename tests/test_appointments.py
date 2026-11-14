from datetime import datetime, timezone


def _appointment_setup(client):
    admin = {"Authorization": "Bearer admin-token"}
    patient = {"Authorization": "Bearer patient-token"}
    profile = client.post("/patients/me", headers=patient, json={
        "phone": "11999990000", "cpf": "52998224725", "birth_date": "1990-01-01",
    })
    assert profile.status_code == 201, profile.text
    specialty = client.post("/specialties/", headers=admin, json={"name": "Agenda Médica"}).json()
    professional = client.post("/professionals/", headers=admin, json={
        "name": "Dra. Consulta", "phone": "11999990001", "council_number": "A100",
        "council_type": "CRM", "council_state": "SP", "specialty_ids": [specialty["id"]],
    }).json()
    service = client.post("/services/", headers=admin, json={
        "name": "Consulta de teste", "duration_minutes": 30, "buffer_minutes": 10,
        "specialty_id": specialty["id"], "professional_ids": [professional["id"]],
    }).json()
    schedule = client.post(f"/professionals/{professional['id']}/schedules", headers=admin, json={
        "valid_from": "2030-01-01", "timezone_name": "America/Sao_Paulo",
    }).json()
    for weekday in (0, 1):
        response = client.put(f"/schedules/{schedule['id']}/days/{weekday}", headers=admin, json={
            "is_active": True, "periods": [{"start_time": "08:00", "end_time": "12:00"}],
        })
        assert response.status_code == 200, response.text
    return admin, patient, profile.json(), professional, service


def test_patient_books_and_cannot_double_book_professional(client, seeded_users):
    admin, patient, profile, professional, service = _appointment_setup(client)
    payload = {"professional_id": professional["id"], "service_id": service["id"], "start_at": "2030-01-07T08:00:00-03:00"}
    created = client.post("/appointments/", headers=patient, json=payload)
    assert created.status_code == 201, created.text
    appointment = created.json()
    assert appointment["status"] == "SCHEDULED"
    assert appointment["patient_id"] == profile["id"]
    assert len(client.get(f"/appointments/{appointment['id']}", headers=patient).json()["history"]) == 1

    conflict = client.post("/appointments/", headers=patient, json=payload)
    assert conflict.status_code == 409
    availability = client.get("/availability/windows", params={
        "professional_id": professional["id"], "service_id": service["id"], "date": "2030-01-07",
    }, headers=patient).json()
    assert availability["reservation_ready"] is True
    assert availability["windows"][0]["start_at"].endswith("08:40:00-03:00")


def test_patient_can_only_read_own_appointments_and_notifications(client, seeded_users):
    admin, patient, profile, professional, service = _appointment_setup(client)
    other_user = client.testing_session_factory()
    from e_sus.modules.users.models import User, UserRole
    user = User(user_name="Outro", email="other@example.com", supabase_user_id="supabase-other", role=UserRole.PATIENT)
    other_user.add(user)
    other_user.commit()
    other_user.refresh(user)
    from tests.conftest import FakeSupabaseAuthProvider
    FakeSupabaseAuthProvider.users_by_token["other-token"] = type("SupabaseUser", (), {"id": user.supabase_user_id, "email": user.email})()
    other_id = user.id
    other_user.close()
    other_profile = client.post("/patients/", headers=admin, json={
        "user_id": other_id, "phone": "11999990002", "cpf": "11144477735", "birth_date": "1991-01-01",
    })
    assert other_profile.status_code == 201, other_profile.text

    created = client.post("/appointments/", headers=admin, json={
        "patient_id": profile["id"], "professional_id": professional["id"], "service_id": service["id"],
        "start_at": "2030-01-07T08:00:00-03:00",
    })
    assert created.status_code == 201, created.text
    appointment_id = created.json()["id"]
    assert client.get(f"/appointments/{appointment_id}", headers={"Authorization": "Bearer other-token"}).status_code == 404
    inbox = client.get("/notifications/me", headers=patient)
    assert inbox.status_code == 200
    assert any(item["event_type"] == "BOOKED" for item in inbox.json())
    assert client.patch(f"/notifications/{inbox.json()[0]['id']}/read", headers={"Authorization": "Bearer other-token"}).status_code == 404


def test_admin_configures_notification_rules_and_patient_cannot(client, seeded_users):
    admin = {"Authorization": "Bearer admin-token"}
    patient = {"Authorization": "Bearer patient-token"}
    assert client.get("/notifications/rules", headers=patient).status_code == 403
    changed = client.patch("/notifications/rules/REMINDER", headers=admin, json={
        "reminder_minutes_before": 120, "body_template": "{patient_name}: {service_name}, {date} {time}",
    })
    assert changed.status_code == 200, changed.text
    assert changed.json()["reminder_minutes_before"] == 120
    invalid = client.patch("/notifications/rules/REMINDER", headers=admin, json={"title_template": "{secret}"})
    assert invalid.status_code == 422
    negative = client.patch("/notifications/rules/REMINDER", headers=admin, json={"reminder_minutes_before": 0})
    assert negative.status_code == 422


def test_patient_can_cancel_and_reschedule_own_future_appointment(client, seeded_users):
    admin, patient, profile, professional, service = _appointment_setup(client)
    created = client.post("/appointments/", headers=patient, json={
        "professional_id": professional["id"], "service_id": service["id"], "start_at": "2030-01-07T08:00:00-03:00",
    })
    assert created.status_code == 201, created.text
    appointment_id = created.json()["id"]
    moved = client.post(f"/appointments/{appointment_id}/reschedule", headers=patient, json={
        "start_at": "2030-01-08T09:00:00-03:00", "reason": "Preferência do paciente",
    })
    assert moved.status_code == 200, moved.text
    assert moved.json()["start_at"].startswith("2030-01-08T12:00:00")
    details = client.get(f"/appointments/{appointment_id}", headers=patient).json()
    assert [item["action"] for item in details["history"]] == ["CREATED", "RESCHEDULED"]
    from e_sus.modules.notificatons.models import Notification, NotificationEvent
    db = client.testing_session_factory()
    reminders = db.query(Notification).filter_by(appointment_id=appointment_id, event_type=NotificationEvent.REMINDER.value).all()
    assert len(reminders) == 2 and sum(item.is_cancelled for item in reminders) == 1
    db.close()
    cancelled = client.post(f"/appointments/{appointment_id}/cancel", headers=patient, json={"reason": "Não poderá comparecer"})
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "CANCELLED"
    db = client.testing_session_factory()
    reminders = db.query(Notification).filter_by(appointment_id=appointment_id, event_type=NotificationEvent.REMINDER.value).all()
    assert all(item.is_cancelled for item in reminders)
    db.close()


def test_only_admin_can_complete_appointments(client, seeded_users):
    admin, patient, profile, professional, service = _appointment_setup(client)
    # Seed a past scheduled visit to test the administrative completion transition.
    from datetime import timedelta
    from e_sus.modules.appointments.models import Appointment
    db = client.testing_session_factory()
    patient_record = db.query(__import__("e_sus.modules.patients.models", fromlist=["Patient"]).Patient).filter_by(user_id=1).first()
    professional_record = db.get(__import__("e_sus.modules.professional.models", fromlist=["Professional"]).Professional, professional["id"])
    service_record = db.get(__import__("e_sus.modules.services.models", fromlist=["MedicalService"]).MedicalService, service["id"])
    start = datetime.now(timezone.utc) - timedelta(days=1)
    visit = Appointment(patient=patient_record, professional=professional_record, service=service_record, start_at=start, end_at=start + timedelta(minutes=30), status="SCHEDULED")
    db.add(visit)
    db.commit()
    db.refresh(visit)
    visit_id = visit.id
    db.close()
    assert client.post(f"/appointments/{visit_id}/complete", headers=patient).status_code == 403
    completed = client.post(f"/appointments/{visit_id}/complete", headers=admin)
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "COMPLETED"
