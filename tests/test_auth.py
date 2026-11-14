from e_sus.modules.users.models import User


def test_signup_creates_supabase_account_and_local_profile(client):
    response = client.post(
        "/auth/signup",
        json={"user_name": "Nova Pessoa", "email": "new@example.com", "password": "secret123"},
    )

    assert response.status_code == 201
    assert response.json()["user_id"] == "supabase-new-user"
    db = client.testing_session_factory()
    user = db.query(User).filter_by(email="new@example.com").one()
    assert user.supabase_user_id == "supabase-new-user"
    assert user.user_name == "Nova Pessoa"
    assert not hasattr(user, "password")
    db.close()


def test_login_returns_supabase_tokens(client, seeded_users):
    response = client.post(
        "/auth/login",
        json={"email": "patient@example.com", "password": "secret"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "login-access"
    assert response.json()["refresh_token"] == "login-refresh"


def test_auth_me_returns_local_user_for_valid_supabase_token(client, seeded_users):
    response = client.get("/auth/me", headers={"Authorization": "Bearer patient-token"})

    assert response.status_code == 200
    assert response.json()["id"] == seeded_users["patient_id"]
    assert response.json()["user_name"] == "Paciente Teste"


def test_auth_me_rejects_invalid_token(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer invalid"})

    assert response.status_code == 401


def test_auth_me_requires_bearer_token(client):
    response = client.get("/auth/me")

    assert response.status_code in (401, 403)


def test_signup_cannot_choose_admin_or_professional_role(client):
    response = client.post(
        "/auth/signup",
        json={
            "user_name": "Tentativa",
            "email": "role@example.com",
            "password": "secret",
            "role": "ADMIN",
        },
    )

    assert response.status_code == 422


def test_legacy_professional_role_has_no_authenticated_access(client, seeded_users):
    from types import SimpleNamespace

    from e_sus.modules.users.models import User, UserRole
    from tests.conftest import FakeSupabaseAuthProvider

    db = client.testing_session_factory()
    user = User(
        user_name="Profissional legado",
        email="legacy@example.com",
        supabase_user_id="supabase-legacy",
        role=UserRole.PROFESSIONAL,
    )
    db.add(user)
    db.commit()
    db.close()
    FakeSupabaseAuthProvider.users_by_token["legacy-token"] = SimpleNamespace(
        id="supabase-legacy", email="legacy@example.com"
    )

    response = client.get("/auth/me", headers={"Authorization": "Bearer legacy-token"})
    assert response.status_code == 200


def test_new_catalog_endpoints_are_in_openapi(client):
    paths = client.get("/openapi.json").json()["paths"]
    assert "/patients/me" in paths
    assert "/professionals/" in paths
    assert "/specialties/" in paths
    assert "/services/" in paths


def test_login_rejects_incorrect_password(client):
    response = client.post("/auth/login", json={"email": "patient@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_login_rejects_identity_without_local_user(client):
    response = client.post("/auth/login", json={"email": "unlinked@example.com", "password": "secret"})
    assert response.status_code == 404


def test_refresh_rotates_both_tokens(client):
    response = client.post("/auth/refresh", json={"refresh_token": "old-refresh"})
    assert response.status_code == 200
    assert response.json() == {"access_token": "new-access", "refresh_token": "new-refresh"}


def test_refresh_rejects_invalid_token(client):
    response = client.post("/auth/refresh", json={"refresh_token": "invalid-refresh"})
    assert response.status_code == 401


def test_refresh_preserves_retryable_provider_failure(client):
    response = client.post("/auth/refresh", json={"refresh_token": "temporary-refresh-error"})
    assert response.status_code == 503


def test_logout_revokes_only_current_supabase_session(client, seeded_users):
    from tests.conftest import FakeSupabaseAuthProvider
    response = client.post("/auth/logout", headers={"Authorization": "Bearer patient-token"})
    assert response.status_code == 200
    assert FakeSupabaseAuthProvider.signed_out == ["patient-token"]


def test_auth_me_returns_professional_role(client):
    from types import SimpleNamespace
    from e_sus.modules.users.models import User, UserRole
    from tests.conftest import FakeSupabaseAuthProvider
    db = client.testing_session_factory()
    user = User(user_name="Profissional", email="professional@example.com", supabase_user_id="supabase-professional", role=UserRole.PROFESSIONAL)
    db.add(user)
    db.commit()
    db.close()
    FakeSupabaseAuthProvider.users_by_token["professional-token"] = SimpleNamespace(id="supabase-professional", email="professional@example.com")
    response = client.get("/auth/me", headers={"Authorization": "Bearer professional-token"})
    assert response.status_code == 200
    assert response.json()["role"] == "PROFESSIONAL"
    protected = client.get("/patients/me", headers={"Authorization": "Bearer professional-token"})
    assert protected.status_code == 403


def test_auth_me_preserves_temporary_auth_provider_failure(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer provider-unavailable"})
    assert response.status_code == 503
