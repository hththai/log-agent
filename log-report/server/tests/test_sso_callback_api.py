import pytest
from fastapi.responses import RedirectResponse

from app.config import settings
from app.main import app
from app.services.sso_store import SsoConfigStore, get_sso_store

ADMIN_TOKEN = "test-admin-token"

PROVIDER_PAYLOAD = {
    "provider_type": "oidc",
    "issuer": "https://accounts.google.com",
    "client_id": "client-123",
    "client_secret": "super-secret",
    "redirect_uri": "http://localhost:8000/sso/callback",
    "enabled": True,
    "claim_mapping": {"email": "email"},
}


class _FakeOAuthClient:
    def __init__(self, userinfo=None, authorize_exception=None):
        self._userinfo = userinfo or {}
        self._authorize_exception = authorize_exception

    async def authorize_redirect(self, request, redirect_uri):
        return RedirectResponse(f"https://idp.example.com/authorize?redirect_uri={redirect_uri}", status_code=302)

    async def authorize_access_token(self, request):
        if self._authorize_exception:
            raise self._authorize_exception
        return {"userinfo": self._userinfo}


@pytest.fixture(autouse=True)
def _sso_test_env(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "admin_api_token", ADMIN_TOKEN)
    monkeypatch.setattr(settings, "session_secret_key", "test-session-secret")

    store = SsoConfigStore(path=tmp_path / "sso_config.json")
    app.dependency_overrides[get_sso_store] = lambda: store

    yield store

    app.dependency_overrides.pop(get_sso_store, None)


def _configure_provider(client, **overrides):
    payload = {**PROVIDER_PAYLOAD, **overrides}
    res = client.post("/sso/config", json=payload, headers={"X-Admin-Token": ADMIN_TOKEN})
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


def _mock_oauth_client(monkeypatch, fake_client):
    monkeypatch.setattr("app.routers.sso.build_oauth_client", lambda provider: fake_client)


# --- GET /sso/authorize -----------------------------------------------------


def test_authorize_returns_503_when_no_provider_configured(client):
    res = client.get("/sso/authorize", follow_redirects=False)
    assert res.status_code == 503


def test_authorize_returns_503_when_provider_disabled(client):
    _configure_provider(client, enabled=False)
    res = client.get("/sso/authorize", follow_redirects=False)
    assert res.status_code == 503


def test_authorize_redirects_to_the_provider_when_configured(client, monkeypatch):
    _configure_provider(client)
    _mock_oauth_client(monkeypatch, _FakeOAuthClient())

    res = client.get("/sso/authorize", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"].startswith("https://idp.example.com/authorize")


# --- GET /sso/callback -------------------------------------------------------


def test_callback_grants_session_and_redirects_to_landing_route_for_matching_identity(client, monkeypatch):
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")
    _mock_oauth_client(monkeypatch, _FakeOAuthClient(userinfo={"sub": "123", "email": "admin@example.com"}))

    res = client.get("/sso/callback?code=abc&state=xyz", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"] == f"{settings.client_base_url}/"

    session_res = client.get("/sso/session")
    body = session_res.json()
    assert body["granted"] is True
    assert body["role"] == "admin"
    assert body["email"] == "admin@example.com"


def test_callback_denies_and_redirects_to_login_with_no_session_when_identity_is_not_mapped(client, monkeypatch):
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")
    _mock_oauth_client(monkeypatch, _FakeOAuthClient(userinfo={"sub": "999", "email": "nobody@example.com"}))

    res = client.get("/sso/callback?code=abc&state=xyz", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"].startswith(f"{settings.client_base_url}/login?error=")

    session_res = client.get("/sso/session")
    assert session_res.json()["granted"] is False


def test_callback_denies_with_no_session_when_required_attribute_is_missing(client, monkeypatch):
    _configure_provider(client)
    _add_mapping(client, claim_name="groups", expected_value="admins", role="admin")
    _mock_oauth_client(monkeypatch, _FakeOAuthClient(userinfo={"sub": "123", "email": "user@example.com"}))

    res = client.get("/sso/callback?code=abc&state=xyz", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"].startswith(f"{settings.client_base_url}/login?error=")

    session_res = client.get("/sso/session")
    assert session_res.json()["granted"] is False


def test_callback_redirects_to_login_with_no_session_on_authlib_exception(client, monkeypatch):
    """Simulates a consent-denial/callback exception (e.g. state mismatch, cancelled consent)."""
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")
    _mock_oauth_client(monkeypatch, _FakeOAuthClient(authorize_exception=RuntimeError("access_denied")))

    res = client.get("/sso/callback?error=access_denied", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"].startswith(f"{settings.client_base_url}/login?error=")

    session_res = client.get("/sso/session")
    assert session_res.json()["granted"] is False


def test_callback_redirects_to_login_when_provider_not_configured(client):
    res = client.get("/sso/callback?code=abc&state=xyz", follow_redirects=False)

    assert res.status_code == 302
    assert res.headers["location"].startswith(f"{settings.client_base_url}/login?error=")


# --- GET /sso/session ---------------------------------------------------------


def test_session_reports_granted_false_when_no_session_exists(client):
    res = client.get("/sso/session")
    body = res.json()
    assert body["granted"] is False
    assert body["role"] is None
    assert body["email"] is None


# --- POST /sso/logout ----------------------------------------------------------


def test_logout_clears_an_active_session(client, monkeypatch):
    _configure_provider(client)
    _add_mapping(client, expected_value="admin@example.com", role="admin")
    _mock_oauth_client(monkeypatch, _FakeOAuthClient(userinfo={"sub": "123", "email": "admin@example.com"}))
    client.get("/sso/callback?code=abc&state=xyz", follow_redirects=False)
    assert client.get("/sso/session").json()["granted"] is True

    logout_res = client.post("/sso/logout")
    assert logout_res.status_code == 200

    assert client.get("/sso/session").json()["granted"] is False


def test_logout_is_idempotent_with_no_active_session(client):
    res = client.post("/sso/logout")
    assert res.status_code == 200
    assert client.get("/sso/session").json()["granted"] is False
