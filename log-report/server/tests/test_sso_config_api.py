import pytest

import app.routers.sso as sso_router
from app.config import settings
from app.services.sso_store import SsoConfigStore, get_sso_store
from app.main import app

ADMIN_TOKEN = "test-admin-token"


@pytest.fixture(autouse=True)
def _sso_test_env(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "admin_api_token", ADMIN_TOKEN)
    monkeypatch.setattr(settings, "sso_client_secret", "")

    store = SsoConfigStore(path=tmp_path / "sso_config.json")
    app.dependency_overrides[get_sso_store] = lambda: store

    async def fake_metadata(_config):
        return {"issuer": _config.issuer, "authorization_endpoint": "https://idp.example.com/authorize"}

    monkeypatch.setattr(sso_router, "fetch_server_metadata", fake_metadata)

    yield store

    app.dependency_overrides.pop(get_sso_store, None)


VALID_PAYLOAD = {
    "provider_type": "oidc",
    "issuer": "https://accounts.google.com",
    "client_id": "client-123",
    "client_secret": "super-secret",
    "redirect_uri": "https://app.example.com/callback",
    "enabled": True,
    "claim_mapping": {"email": "email"},
}


def test_get_config_is_public_and_returns_empty_state_initially(client):
    res = client.get("/sso/config")
    assert res.status_code == 200
    body = res.json()
    assert body["provider"] is None
    assert body["demo_mode"]["enabled"] is False


def test_post_config_without_admin_token_is_rejected(client):
    res = client.post("/sso/config", json=VALID_PAYLOAD)
    assert res.status_code == 401


def test_post_config_with_wrong_admin_token_is_rejected(client):
    res = client.post(
        "/sso/config",
        json=VALID_PAYLOAD,
        headers={"X-Admin-Token": "not-the-right-token"},
    )
    assert res.status_code == 401


def test_post_config_with_correct_admin_token_saves_and_redacts_secret(client):
    res = client.post(
        "/sso/config",
        json=VALID_PAYLOAD,
        headers={"X-Admin-Token": ADMIN_TOKEN},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["provider"]["issuer"] == VALID_PAYLOAD["issuer"]
    assert body["provider"]["has_client_secret"] is True
    assert "client_secret" not in body["provider"]

    # And GET (no token needed) reflects the same redacted state.
    get_res = client.get("/sso/config")
    assert get_res.json()["provider"]["issuer"] == VALID_PAYLOAD["issuer"]


def test_post_config_missing_required_field_is_rejected(client):
    payload = dict(VALID_PAYLOAD)
    payload["issuer"] = ""
    res = client.post("/sso/config", json=payload, headers={"X-Admin-Token": ADMIN_TOKEN})
    assert res.status_code == 422


def test_validate_without_admin_token_is_rejected(client):
    res = client.post("/sso/validate")
    assert res.status_code == 401


def test_validate_reports_not_ready_when_unconfigured(client):
    res = client.post("/sso/validate", headers={"X-Admin-Token": ADMIN_TOKEN})
    assert res.status_code == 200
    body = res.json()
    assert body["ready"] is False
    assert "No SSO provider is configured" in body["reasons"]


def test_validate_reports_ready_once_fully_configured(client):
    client.post("/sso/config", json=VALID_PAYLOAD, headers={"X-Admin-Token": ADMIN_TOKEN})
    res = client.post("/sso/validate", headers={"X-Admin-Token": ADMIN_TOKEN})
    body = res.json()
    assert body["ready"] is True
    assert body["reasons"] == []
