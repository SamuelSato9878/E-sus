from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from e_sus.modules.patients.models import Patient


PATIENT_PROFILE = {
    "phone": "+55 11 99999-0000",
    "cpf": "529.982.247-25",
    "birth_date": "1990-05-20",
    "address": "Rua Exemplo, 10",
    "sex": None,
}


def test_patient_can_create_and_read_only_own_profile(client, seeded_users):
    created = client.post(
        "/patients/me",
        headers={"Authorization": "Bearer patient-token"},
        json=PATIENT_PROFILE,
    )
    assert created.status_code == 201
    assert created.json()["cpf"] == "52998224725"
    assert created.json()["user_name"] == "Paciente Teste"
    assert created.json()["email"] == "patient@example.com"
    assert created.json()["is_active"] is True

    own = client.get("/patients/me", headers={"Authorization": "Bearer patient-token"})
    assert own.status_code == 200
    assert own.json()["id"] == created.json()["id"]

    other_user = client.testing_session_factory()
    from e_sus.modules.users.models import User, UserRole
    from types import SimpleNamespace
    from tests.conftest import FakeSupabaseAuthProvider

    second_patient = User(
        user_name="Outro Paciente",
        email="other-patient@example.com",
        supabase_user_id="supabase-other-patient",
        role=UserRole.PATIENT,
    )
    other_user.add(second_patient)
    other_user.commit()
    FakeSupabaseAuthProvider.users_by_token["other-patient-token"] = SimpleNamespace(
        id=second_patient.supabase_user_id, email=second_patient.email
    )
    other_user.close()

    other_profile = client.get(
        "/patients/me", headers={"Authorization": "Bearer other-patient-token"}
    )
    assert other_profile.status_code == 404
    assert client.get(
        f"/patients/{created.json()['id']}",
        headers={"Authorization": "Bearer patient-token"},
    ).status_code == 403


def test_admin_can_create_list_update_and_deactivate_patient(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    created = client.post(
        "/patients/",
        headers=headers,
        json={"user_id": seeded_users["patient_id"], **PATIENT_PROFILE},
    )
    assert created.status_code == 201
    assert created.json()["cpf"] == "52998224725"

    listing = client.get("/patients/", headers=headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1

    updated = client.patch(
        f"/patients/{created.json()['id']}",
        headers=headers,
        json={"address": "Novo endereço", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["address"] == "Novo endereço"
    assert updated.json()["is_active"] is False


def test_patient_cannot_access_admin_patient_listing(client, seeded_users):
    response = client.get("/patients/", headers={"Authorization": "Bearer patient-token"})
    assert response.status_code == 403


def test_invalid_cpf_is_rejected_and_not_stored(client, seeded_users):
    bad_profile = {**PATIENT_PROFILE, "cpf": "111.111.111-11"}
    response = client.post(
        "/patients/me",
        headers={"Authorization": "Bearer patient-token"},
        json=bad_profile,
    )
    assert response.status_code == 422


def test_duplicate_cpf_is_rejected(client, seeded_users):
    headers = {"Authorization": "Bearer admin-token"}
    first = client.post(
        "/patients/",
        headers=headers,
        json={"user_id": seeded_users["patient_id"], **PATIENT_PROFILE},
    )
    assert first.status_code == 201

    # A second patient identity cannot claim the same CPF.
    from e_sus.modules.users.models import User, UserRole

    db = client.testing_session_factory()
    second_user = User(
        user_name="Segunda Pessoa",
        email="second@example.com",
        supabase_user_id="supabase-second",
        role=UserRole.PATIENT,
    )
    db.add(second_user)
    db.commit()
    second_user_id = second_user.id
    db.close()

    duplicate = client.post(
        "/patients/",
        headers=headers,
        json={"user_id": second_user_id, **PATIENT_PROFILE},
    )
    assert duplicate.status_code == 409


def test_patient_user_cannot_be_physically_deleted(client, seeded_users):
    profile = client.post(
        "/patients/me",
        headers={"Authorization": "Bearer patient-token"},
        json=PATIENT_PROFILE,
    )
    assert profile.status_code == 201

    deleted = client.delete(
        f"/users/{seeded_users['patient_id']}",
        headers={"Authorization": "Bearer admin-token"},
    )
    assert deleted.status_code == 409


def test_database_rejects_cpf_with_wrong_length(client, seeded_users):
    db = client.testing_session_factory()
    db.add(
        Patient(
            user_id=seeded_users["patient_id"],
            phone="11999990000",
            cpf="1234567890",
            birth_date=date(1990, 5, 20),
        )
    )
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    db.close()
