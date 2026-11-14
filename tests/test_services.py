def _create_specialty_and_professional(client, headers, name="Clínica"):
    specialty = client.post(
        "/specialties/", headers=headers, json={"name": name}
    ).json()
    professional = client.post(
        "/professionals/",
        headers=headers,
        json={
            "name": f"Dr. {name}",
            "phone": "11999990000",
            "council_number": f"{len(name)}1234",
            "council_type": "CRM",
            "council_state": "SP",
            "specialty_ids": [specialty["id"]],
        },
    ).json()
    return specialty, professional


def test_admin_creates_service_with_valid_professional_association(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    specialty, professional = _create_specialty_and_professional(client, headers)

    created = client.post(
        "/services/",
        headers=headers,
        json={
            "name": "Consulta inicial",
            "description": "Consulta médica",
            "duration_minutes": 30,
            "specialty_id": specialty["id"],
            "professional_ids": [professional["id"]],
        },
    )
    assert created.status_code == 201
    service = created.json()
    assert service["duration_minutes"] == 30
    assert service["professional_ids"] == [professional["id"]]

    professional_response = client.get(
        f"/professionals/{professional['id']}", headers=headers
    )
    assert professional_response.json()["service_ids"] == [service["id"]]

    patient_catalog = client.get(
        "/services/", headers={"Authorization": "Bearer patient-token"}
    )
    assert patient_catalog.status_code == 200
    assert len(patient_catalog.json()) == 1


def test_service_rejects_professional_without_matching_specialty(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    specialty_a, professional = _create_specialty_and_professional(client, headers, "Pediatria")
    specialty_b = client.post(
        "/specialties/", headers=headers, json={"name": "Neurologia"}
    ).json()

    response = client.post(
        "/services/",
        headers=headers,
        json={
            "name": "Consulta neurológica",
            "duration_minutes": 45,
            "specialty_id": specialty_b["id"],
            "professional_ids": [professional["id"]],
        },
    )
    assert response.status_code == 409
    assert client.get("/services/", headers=headers).json() == []


def test_service_validates_duration_and_rejects_price_field(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    specialty, _ = _create_specialty_and_professional(client, headers)
    payload = {
        "name": "Procedimento",
        "duration_minutes": 0,
        "specialty_id": specialty["id"],
    }
    assert client.post("/services/", headers=headers, json=payload).status_code == 422

    valid = {
        **payload,
        "duration_minutes": 20,
    }
    response = client.post("/services/", headers=headers, json=valid)
    assert response.status_code == 201

    with_price = {**valid, "name": "Com preço", "price": "100.00"}
    assert client.post("/services/", headers=headers, json=with_price).status_code == 422


def test_service_can_be_updated_and_deactivated_without_deletion(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    specialty, _ = _create_specialty_and_professional(client, headers)
    service = client.post(
        "/services/",
        headers=headers,
        json={
            "name": "Retorno",
            "duration_minutes": 15,
            "specialty_id": specialty["id"],
        },
    ).json()

    update = client.patch(
        f"/services/{service['id']}",
        headers=headers,
        json={"duration_minutes": 20, "is_active": False},
    )
    assert update.status_code == 200
    assert update.json()["duration_minutes"] == 20
    assert update.json()["is_active"] is False
    assert client.get("/services/", headers={"Authorization": "Bearer patient-token"}).json() == []


def test_service_management_is_admin_only(client, seeded_users):
    response = client.post(
        "/services/",
        headers={"Authorization": "Bearer patient-token"},
        json={"name": "Consulta", "duration_minutes": 30, "specialty_id": 1},
    )
    assert response.status_code == 403


def test_professional_cannot_drop_specialty_used_by_service(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    specialty, professional = _create_specialty_and_professional(client, headers)
    service = client.post(
        "/services/",
        headers=headers,
        json={
            "name": "Consulta vinculada",
            "duration_minutes": 30,
            "specialty_id": specialty["id"],
            "professional_ids": [professional["id"]],
        },
    )
    assert service.status_code == 201

    other_specialty = client.post(
        "/specialties/", headers=headers, json={"name": "Outra área"}
    ).json()
    update = client.patch(
        f"/professionals/{professional['id']}",
        headers=headers,
        json={"specialty_ids": [other_specialty["id"]]},
    )
    assert update.status_code == 409


def test_service_catalog_requires_authentication(client):
    assert client.get("/services/").status_code in (401, 403)
