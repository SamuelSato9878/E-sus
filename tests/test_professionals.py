def test_admin_manages_specialties_and_professional_specialty_relation(client, seeded_users):
    admin_headers = {"Authorization": "Bearer admin-token"}
    specialty_response = client.post(
        "/specialties/",
        headers=admin_headers,
        json={"name": "Cardiologia", "description": "Atendimento cardiológico"},
    )
    assert specialty_response.status_code == 201
    specialty_id = specialty_response.json()["id"]

    professional_response = client.post(
        "/professionals/",
        headers=admin_headers,
        json={
            "name": "Dra. Ana",
            "phone": "11999990000",
            "council_number": "12345",
            "council_type": "crm",
            "council_state": "sp",
            "specialty_ids": [specialty_id],
        },
    )
    assert professional_response.status_code == 201
    professional_id = professional_response.json()["id"]
    assert professional_response.json()["council_type"] == "CRM"
    assert professional_response.json()["council_state"] == "SP"
    assert professional_response.json()["specialty_ids"] == [specialty_id]
    assert professional_response.json()["is_active"] is True

    specialty = client.get(f"/specialties/{specialty_id}", headers=admin_headers)
    assert specialty.status_code == 200
    assert specialty.json()["professional_ids"] == [professional_id]

    update = client.patch(
        f"/professionals/{professional_id}",
        headers=admin_headers,
        json={"is_active": False},
    )
    assert update.status_code == 200
    assert update.json()["is_active"] is False

    patient_catalog = client.get(
        "/professionals/", headers={"Authorization": "Bearer patient-token"}
    )
    assert patient_catalog.status_code == 200
    assert patient_catalog.json() == []


def test_specialty_and_professional_writes_are_admin_only(client, seeded_users):
    patient_headers = {"Authorization": "Bearer patient-token"}
    specialty = client.post("/specialties/", headers=patient_headers, json={"name": "Clínica"})
    professional = client.post(
        "/professionals/",
        headers=patient_headers,
        json={
            "name": "Profissional",
            "phone": "11999990000",
            "council_number": "54321",
            "council_type": "CRM",
            "council_state": "SP",
        },
    )
    assert specialty.status_code == 403
    assert professional.status_code == 403


def test_council_registration_is_unique_and_restricted_to_admin(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    payload = {
        "name": "Profissional A",
        "phone": "11999990000",
        "council_number": "76543",
        "council_type": "CRM",
        "council_state": "SP",
    }
    assert client.post("/professionals/", headers=headers, json=payload).status_code == 201
    duplicate = {**payload, "name": "Profissional B"}
    assert client.post("/professionals/", headers=headers, json=duplicate).status_code == 409


def test_specialty_name_is_unique_and_can_be_deactivated(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    first = client.post("/specialties/", headers=headers, json={"name": "Dermatologia"})
    assert first.status_code == 201
    assert client.post(
        "/specialties/", headers=headers, json={"name": "Dermatologia"}
    ).status_code == 409

    updated = client.patch(
        f"/specialties/{first.json()['id']}",
        headers=headers,
        json={"is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["is_active"] is False


def test_catalog_reads_require_authentication(client):
    assert client.get("/professionals/").status_code in (401, 403)
    assert client.get("/specialties/").status_code in (401, 403)
