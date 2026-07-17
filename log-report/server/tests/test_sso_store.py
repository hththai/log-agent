from app.models.sso import AccessMappingInput, DemoModeConfig, SSOProviderConfigInput
from app.services.sso_store import SsoConfigStore

def make_store(tmp_path):
    return SsoConfigStore(path=tmp_path / "sso_config.json")


def test_returns_none_when_no_provider_configured(tmp_path):
    store = make_store(tmp_path)
    assert store.get_provider_config() is None
    assert store.to_public(store.get_provider_config()) is None


def test_save_and_read_provider_config(tmp_path):
    store = make_store(tmp_path)
    store.save_provider_config(
        SSOProviderConfigInput(
            provider_type="oidc",
            issuer="https://accounts.google.com",
            client_id="client-123",
            client_secret="super-secret",
            redirect_uri="https://app.example.com/callback",
            enabled=True,
            claim_mapping={"email": "email"},
        )
    )

    config = store.get_provider_config()
    assert config is not None
    assert config.issuer == "https://accounts.google.com"
    assert config.client_secret == "super-secret"


def test_public_config_never_exposes_the_raw_secret(tmp_path):
    store = make_store(tmp_path)
    store.save_provider_config(
        SSOProviderConfigInput(
            provider_type="oidc",
            issuer="https://accounts.google.com",
            client_id="client-123",
            client_secret="super-secret",
            redirect_uri="https://app.example.com/callback",
            enabled=True,
            claim_mapping={},
        )
    )

    public = store.to_public(store.get_provider_config())
    assert public.has_client_secret is True
    assert "client_secret" not in public.model_dump()
    assert "super-secret" not in str(public.model_dump())


def test_saving_without_a_new_secret_keeps_the_existing_one(tmp_path):
    store = make_store(tmp_path)
    store.save_provider_config(
        SSOProviderConfigInput(
            provider_type="oidc",
            issuer="https://accounts.google.com",
            client_id="client-123",
            client_secret="super-secret",
            redirect_uri="https://app.example.com/callback",
            enabled=True,
            claim_mapping={},
        )
    )
    store.save_provider_config(
        SSOProviderConfigInput(
            provider_type="oidc",
            issuer="https://accounts.google.com",
            client_id="client-123",
            client_secret=None,
            redirect_uri="https://app.example.com/callback",
            enabled=False,
            claim_mapping={},
        )
    )

    config = store.get_provider_config()
    assert config.client_secret == "super-secret"
    assert config.enabled is False


def test_demo_mode_round_trips(tmp_path):
    store = make_store(tmp_path)
    store.save_demo_mode(DemoModeConfig(enabled=True, default_email="demo@example.com", allow_local_validation=True))
    demo = store.get_demo_mode()
    assert demo.enabled is True
    assert demo.default_email == "demo@example.com"


def test_mapping_save_list_and_delete(tmp_path):
    store = make_store(tmp_path)
    mapping = store.save_mapping(
        AccessMappingInput(claim_name="email", expected_value="admin@example.com", role="admin", allowed=True)
    )

    assert [m.id for m in store.list_mappings()] == [mapping.id]

    assert store.delete_mapping(mapping.id) is True
    assert store.list_mappings() == []
    assert store.delete_mapping("does-not-exist") is False
