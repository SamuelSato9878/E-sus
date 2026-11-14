def test_user_management_requires_authentication(client):
    response = client.get("/users/")

    assert response.status_code in (401, 403)


def test_non_admin_cannot_manage_users(client, seeded_users):
    response = client.get("/users/", headers={"Authorization": "Bearer patient-token"})

    assert response.status_code == 403


def test_admin_can_manage_users_and_linked_patient_cannot_be_deleted(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}

    listing = client.get("/users/", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 2

    created = client.post(
        "/users/",
        headers=headers,
        json={
            "user_name": "Novo Usuário",
            "email": "local@example.com",
            "supabase_user_id": "supabase-local-user",
        },
    )
    assert created.status_code == 201
    user_id = created.json()["id"]
    assert created.json()["role"] == "PATIENT"

    updated = client.put(
        f"/users/{user_id}",
        headers=headers,
        json={"user_name": "Nome Atualizado", "email": "updated@example.com"},
    )
    assert updated.status_code == 200
    assert updated.json()["user_name"] == "Nome Atualizado"
    assert updated.json()["email"] == "updated@example.com"

    deleted = client.delete(f"/users/{user_id}", headers=headers)
    assert deleted.status_code == 409
    assert "dados vinculados" in deleted.json()["detail"]
    assert client.get(f"/users/{user_id}", headers=headers).status_code == 200


def test_admin_can_create_local_user_without_password(client, seeded_users):
    response = client.post(
        "/users/",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "user_name": "Sem Senha Local",
            "email": "no-password@example.com",
            "supabase_user_id": "supabase-no-password",
            "password": "must-not-be-accepted",
        },
    )

    assert response.status_code == 422


def test_api_cannot_assign_legacy_professional_role(client, seeded_users):
    response = client.post(
        "/users/",
        headers={"Authorization": "Bearer admin-token"},
        json={
            "user_name": "Perfil legado",
            "email": "legacy-professional@example.com",
            "supabase_user_id": "supabase-legacy-professional",
            "role": "PROFESSIONAL",
        },
    )

    assert response.status_code == 422
