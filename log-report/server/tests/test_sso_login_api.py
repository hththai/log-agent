import pytest

from app.config import settings
from app.main import app
from app.services.sso_store import SsoConfigStore, get_sso_store

ADMIN_TOKEN = "test-admin-token"

PROVIDER_PAYLOAD = {
    "provider_type": "oidc",
    "issuer": "https://accounts.google.com",
    "client_id": "client-123",
    "client_secret": "super-secret",
    "redirect_uri": "https://app.example.com/callback",
    "enabled": True,
    "claim_mapping": {"email": "email"},
}


@pytest.fixture(autouse=True)
def _sso_test_env(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "admin_api_token", ADMIN_TOKEN)

    store = SsoConfigStore(path=tmp_path / "sso_config.json")
    app.dependency_overrides[get_sso_store] = lambda: store

    yield store

    app.dependency_overrides.pop(get_sso_store, None)


def _configure_provider(client):
    res = client.post("/sso/config", json=PROVIDER_PAYLOAD, headers={"X-Admin-Token": ADMIN_TOKEN})
    assert res.status_code == 200


def _add_mapping(client, **overrides):
    payload = {
        "claim_name": "email",
        "expected_value": "admin@example.com",
        "role": "admin",
        "allowed": True,
        "description": "",
    }
    payload.update(overrides)
    res = client.post("/sso/mappings", json=payload, headers={"X-Admin-Token": ADMIN_TOKEN})
    assert res.status_code == 200
    return res.json()


def test_login_without_provider_or_demo_mode_is_denied(client):
    res = client.post("/sso/login", json={"email": "user@example.com"})
    assert res.status_code == 200
    body = res.json()
    assert body["granted"] is False
    assert "not configured" in body["reason"]


def test_login_with_matching_mapping_is_granted_the_mapped_role(client):
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")

    res = client.post("/sso/login", json={"email": "admin@example.com"})
    body = res.json()

    assert body["granted"] is True
    assert body["role"] == "admin"
    assert body["email"] == "admin@example.com"
    assert body["reason"] is None


def test_login_with_no_matching_mapping_is_denied(client):
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")

    res = client.post("/sso/login", json={"email": "nobody@example.com"})
    body = res.json()

    assert body["granted"] is False
    assert body["role"] is None
    assert body["reason"]


def test_login_matching_a_blocked_mapping_is_denied(client):
    _configure_provider(client)
    _add_mapping(client, expected_value="blocked@example.com", allowed=False, description="blocklisted")

    res = client.post("/sso/login", json={"email": "blocked@example.com"})
    body = res.json()

    assert body["granted"] is False
    assert "blocklisted" in body["reason"]


def test_login_missing_required_attribute_is_denied(client):
    _configure_provider(client)
    _add_mapping(client, claim_name="groups", expected_value="admins", role="admin")

    res = client.post("/sso/login", json={"email": "user@example.com"})
    body = res.json()

    assert body["granted"] is False
    assert "groups" in body["reason"]


def test_login_falls_back_to_demo_mode_when_no_provider_configured(client):
    client.post(
        "/sso/config",
        json={**PROVIDER_PAYLOAD, "demo_mode": {"enabled": True, "default_email": "", "allow_local_validation": True}},
        headers={"X-Admin-Token": ADMIN_TOKEN},
    )
    # Disable the provider so the demo-mode fallback path is exercised.
    client.post(
        "/sso/config",
        json={**PROVIDER_PAYLOAD, "enabled": False},
        headers={"X-Admin-Token": ADMIN_TOKEN},
    )
    _add_mapping(client, expected_value="demo@example.com", role="viewer")

    res = client.post("/sso/login", json={"email": "demo@example.com"})
    body = res.json()

    assert body["granted"] is True
    assert body["role"] == "viewer"


def test_login_without_email_is_denied(client):
    res = client.post("/sso/login", json={"email": "  "})
    body = res.json()
    assert body["granted"] is False


def test_get_mappings_requires_no_auth_and_post_requires_admin_token(client):
    res = client.get("/sso/mappings")
    assert res.status_code == 200
    assert res.json() == []

    unauth = client.post(
        "/sso/mappings",
        json={"claim_name": "email", "expected_value": "a@b.com", "role": "viewer", "allowed": True, "description": ""},
    )
    assert unauth.status_code == 401

    created = _add_mapping(client, expected_value="a@b.com", role="viewer")
    listed = client.get("/sso/mappings").json()
    assert [m["id"] for m in listed] == [created["id"]]
