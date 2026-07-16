import json
import uuid
from pathlib import Path

from app.config import settings
from app.models.sso import (
    AccessMapping,
    AccessMappingInput,
    DemoModeConfig,
    SSOProviderConfig,
    SSOProviderConfigInput,
    SSOProviderConfigPublic,
)

_EMPTY_STATE = {"provider": None, "mappings": [], "demo_mode": None}


class SsoConfigStore:
    """File-backed store for SSO provider config, mappings, and demo-mode settings.

    No database table is introduced for v1 (per plan.md) — state lives in a
    single git-ignored JSON file. The raw client_secret is only ever read
    here and in the OIDC client factory; every other layer must go through
    to_public() to avoid leaking it.
    """

    def __init__(self, path: str | Path | None = None):
        self._path = Path(path or settings.sso_config_path)
        self._path.parent.mkdir(parents=True, exist_ok=True)

    def _read(self) -> dict:
        if not self._path.exists():
            return dict(_EMPTY_STATE)
        try:
            return json.loads(self._path.read_text())
        except (json.JSONDecodeError, OSError):
            return dict(_EMPTY_STATE)

    def _write(self, data: dict) -> None:
        self._path.write_text(json.dumps(data, indent=2))

    # --- Provider config -------------------------------------------------

    def get_provider_config(self) -> SSOProviderConfig | None:
        raw = self._read().get("provider")
        if not raw:
            return None
        config = SSOProviderConfig.model_validate(raw)
        if not config.client_secret and settings.sso_client_secret:
            config.client_secret = settings.sso_client_secret
        return config

    def save_provider_config(self, payload: SSOProviderConfigInput) -> SSOProviderConfig:
        data = self._read()
        existing = data.get("provider") or {}
        config = SSOProviderConfig(
            id=existing.get("id", "default"),
            provider_type=payload.provider_type,
            issuer=payload.issuer,
            client_id=payload.client_id,
            client_secret=payload.client_secret or existing.get("client_secret"),
            redirect_uri=payload.redirect_uri,
            enabled=payload.enabled,
            claim_mapping=payload.claim_mapping,
        )
        data["provider"] = config.model_dump(mode="json")
        self._write(data)
        return self.get_provider_config() or config

    @staticmethod
    def to_public(config: SSOProviderConfig | None) -> SSOProviderConfigPublic | None:
        if config is None:
            return None
        return SSOProviderConfigPublic(
            id=config.id,
            provider_type=config.provider_type,
            issuer=config.issuer,
            client_id=config.client_id,
            redirect_uri=config.redirect_uri,
            enabled=config.enabled,
            claim_mapping=config.claim_mapping,
            has_client_secret=bool(config.client_secret),
        )

    # --- Demo mode ---------------------------------------------------------

    def get_demo_mode(self) -> DemoModeConfig:
        raw = self._read().get("demo_mode")
        return DemoModeConfig.model_validate(raw) if raw else DemoModeConfig()

    def save_demo_mode(self, demo: DemoModeConfig) -> DemoModeConfig:
        data = self._read()
        data["demo_mode"] = demo.model_dump(mode="json")
        self._write(data)
        return demo

    # --- Access mappings -----------------------------------------------------

    def list_mappings(self) -> list[AccessMapping]:
        raw = self._read().get("mappings") or []
        return [AccessMapping.model_validate(m) for m in raw]

    def save_mapping(self, payload: AccessMappingInput) -> AccessMapping:
        data = self._read()
        mappings = data.get("mappings") or []
        mapping_id = payload.id or str(uuid.uuid4())
        mapping = AccessMapping(
            id=mapping_id,
            claim_name=payload.claim_name,
            expected_value=payload.expected_value,
            role=payload.role,
            allowed=payload.allowed,
            description=payload.description,
        )
        mappings = [m for m in mappings if m.get("id") != mapping_id]
        mappings.append(mapping.model_dump(mode="json"))
        data["mappings"] = mappings
        self._write(data)
        return mapping

    def delete_mapping(self, mapping_id: str) -> bool:
        data = self._read()
        mappings = data.get("mappings") or []
        remaining = [m for m in mappings if m.get("id") != mapping_id]
        removed = len(remaining) != len(mappings)
        if removed:
            data["mappings"] = remaining
            self._write(data)
        return removed


_store: SsoConfigStore | None = None


def get_sso_store() -> SsoConfigStore:
    global _store
    if _store is None:
        _store = SsoConfigStore()
    return _store
