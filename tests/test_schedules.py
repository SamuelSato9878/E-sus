from datetime import date


def _setup_schedule(client):
    admin = {"Authorization": "Bearer admin-token"}
    specialty = client.post("/specialties/", headers=admin, json={"name": "Clínica Geral"}).json()
    professional = client.post("/professionals/", headers=admin, json={
        "name": "Dra. Agenda", "phone": "11999990001", "council_number": "98765",
        "council_type": "CRM", "council_state": "SP", "specialty_ids": [specialty["id"]],
    }).json()
    service = client.post("/services/", headers=admin, json={
        "name": "Consulta agenda", "duration_minutes": 30, "buffer_minutes": 10,
        "specialty_id": specialty["id"], "professional_ids": [professional["id"]],
    }).json()
    schedule = client.post(f"/professionals/{professional['id']}/schedules", headers=admin, json={
        "valid_from": "2030-01-01", "timezone_name": "America/Sao_Paulo",
    })
    assert schedule.status_code == 201, schedule.text
    schedule = schedule.json()
    assert schedule["professional_name"] == professional["name"]
    assert client.put(f"/schedules/{schedule['id']}/days/0", headers=admin, json={
        "is_active": True,
        "periods": [{"start_time": "08:00", "end_time": "12:00"}, {"start_time": "13:00", "end_time": "17:00"}],
    }).status_code == 200
    return admin, professional, service, schedule


def test_schedule_period_validation_and_admin_permissions(client, seeded_users):
    admin, professional, service, schedule = _setup_schedule(client)
    assert client.put(f"/schedules/{schedule['id']}/days/1", headers=admin, json={
        "is_active": True,
        "periods": [{"start_time": "08:00", "end_time": "12:00"}, {"start_time": "11:00", "end_time": "13:00"}],
    }).status_code == 422
    assert client.post(f"/professionals/{professional['id']}/schedules", headers={"Authorization": "Bearer patient-token"}, json={
        "valid_from": "2031-01-01",
    }).status_code == 403


def test_schedule_conflicts_copy_and_availability_with_buffer(client, seeded_users):
    admin, professional, service, schedule = _setup_schedule(client)
    duplicate = client.post(f"/professionals/{professional['id']}/schedules", headers=admin, json={"valid_from": "2030-02-01"})
    assert duplicate.status_code == 409
    copied = client.post(f"/schedules/{schedule['id']}/copy-days", headers=admin, json={"source_weekday": 0, "target_weekdays": [1, 2]})
    assert copied.status_code == 200
    day = date(2030, 1, 7)
    availability = client.get("/availability/windows", params={"professional_id": professional["id"], "service_id": service["id"], "date": day.isoformat()}, headers={"Authorization": "Bearer patient-token"})
    assert availability.status_code == 200, availability.text
    data = availability.json()
    assert data["professional_name"] == professional["name"]
    assert data["reservation_ready"] is True
    assert len(data["windows"]) == 2
    assert data["windows"][0]["start_at"].endswith("08:00:00-03:00")
    assert data["windows"][0]["end_at"].endswith("11:20:00-03:00")
    days = client.get("/availability/days", params={"professional_id": professional["id"], "service_id": service["id"], "start": "2030-01-07", "end": "2030-01-13"}, headers={"Authorization": "Bearer patient-token"})
    assert days.status_code == 200
    assert "2030-01-07" in days.json() and "2030-01-08" in days.json()


def test_schedule_exception_and_block_override_windows(client, seeded_users):
    admin, professional, service, schedule = _setup_schedule(client)
    headers = admin
    created = client.post(f"/professionals/{professional['id']}/schedule-blocks", headers=headers, json={
        "start_at": "2030-01-07T09:00:00-03:00", "end_at": "2030-01-07T10:00:00-03:00", "reason": "Reunião administrativa",
    })
    assert created.status_code == 201, created.text
    assert created.json()["professional_name"] == professional["name"]
    changed = client.patch(f"/schedule-blocks/{created.json()['id']}", headers=headers, json={"reason": "Reunião alterada"})
    assert changed.status_code == 200
    assert changed.json()["reason"] == "Reunião alterada"
    windows = client.get("/availability/windows", params={"professional_id": professional["id"], "service_id": service["id"], "date": "2030-01-07"}, headers=headers).json()["windows"]
    assert len(windows) == 3
    closed = client.post(f"/professionals/{professional['id']}/schedule-exceptions", headers=headers, json={
        "exception_date": "2030-01-07", "mode": "CLOSED", "reason": "Feriado",
    })
    assert closed.status_code == 201, closed.text
    assert closed.json()["professional_name"] == professional["name"]
    windows = client.get("/availability/windows", params={"professional_id": professional["id"], "service_id": service["id"], "date": "2030-01-07"}, headers=headers).json()["windows"]
    assert windows == []


def test_exception_replaces_weekly_hours_and_schedule_replication(client, seeded_users):
    admin, professional, service, schedule = _setup_schedule(client)
    second = client.post("/professionals/", headers=admin, json={
        "name": "Dr. Replicado", "phone": "11999990002", "council_number": "98766",
        "council_type": "CRM", "council_state": "SP", "specialty_ids": [1],
    })
    assert second.status_code == 201, second.text
    copied = client.post(f"/schedules/{schedule['id']}/copy-to-professionals", headers=admin, json={"professional_ids": [second.json()["id"]]})
    assert copied.status_code == 201, copied.text
    assert copied.json()[0]["professional_id"] == second.json()["id"]
    assert copied.json()[0]["professional_name"] == second.json()["name"]

    replacement = client.post(f"/professionals/{professional['id']}/schedule-exceptions", headers=admin, json={
        "exception_date": "2030-01-07", "mode": "REPLACE", "reason": "Turno reduzido",
        "periods": [{"start_time": "10:00", "end_time": "12:00"}],
    })
    assert replacement.status_code == 201, replacement.text
    assert replacement.json()["professional_name"] == professional["name"]
    windows = client.get("/availability/windows", params={"professional_id": professional["id"], "service_id": service["id"], "date": "2030-01-07"}, headers=admin).json()["windows"]
    assert len(windows) == 1
    assert windows[0]["start_at"].endswith("10:00:00-03:00")
    assert windows[0]["end_at"].endswith("11:20:00-03:00")
    updated = client.patch(f"/schedule-exceptions/{replacement.json()['id']}", headers=admin, json={
        "periods": [{"start_time": "09:00", "end_time": "11:00"}],
    })
    assert updated.status_code == 200, updated.text
    assert updated.json()["periods"][0]["start_time"] == "09:00:00"
    deactivated = client.patch(f"/schedule-exceptions/{replacement.json()['id']}", headers=admin, json={"is_active": False})
    assert deactivated.status_code == 200
    windows = client.get("/availability/windows", params={"professional_id": professional["id"], "service_id": service["id"], "date": "2030-01-07"}, headers=admin).json()["windows"]
    assert len(windows) == 2

