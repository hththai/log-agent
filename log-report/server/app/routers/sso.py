from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.models.sso import (
    DemoModeConfig,
    SSOConfigResponse,
    SSOProviderConfigInput,
    SSOValidateResponse,
)
from app.security import require_admin
from app.services.oidc_client import fetch_server_metadata
from app.services.sso_store import SsoConfigStore, get_sso_store

router = APIRouter(prefix="/sso", tags=["sso"])


class SSOConfigRequest(SSOProviderConfigInput):
    demo_mode: DemoModeConfig | None = None


def _config_response(store: SsoConfigStore) -> SSOConfigResponse:
    provider = store.get_provider_config()
    return SSOConfigResponse(
        provider=SsoConfigStore.to_public(provider),
        demo_mode=store.get_demo_mode(),
    )


@router.get("/config", response_model=SSOConfigResponse)
async def get_config(store: Annotated[SsoConfigStore, Depends(get_sso_store)]):
    """Public — returns only the redacted shape that's safe to expose to any caller."""
    return _config_response(store)


@router.post("/config", response_model=SSOConfigResponse, dependencies=[Depends(require_admin)])
async def save_config(
    payload: SSOConfigRequest,
    store: Annotated[SsoConfigStore, Depends(get_sso_store)],
):
    if not payload.provider_type or not payload.issuer or not payload.client_id or not payload.redirect_uri:
        raise HTTPException(
            status_code=422,
            detail="provider_type, issuer, client_id, and redirect_uri are required",
        )
    store.save_provider_config(payload)
    if payload.demo_mode is not None:
        store.save_demo_mode(payload.demo_mode)
    return _config_response(store)


@router.post("/validate", response_model=SSOValidateResponse, dependencies=[Depends(require_admin)])
async def validate_config(store: Annotated[SsoConfigStore, Depends(get_sso_store)]):
    provider = store.get_provider_config()
    reasons: list[str] = []

    if provider is None:
        reasons.append("No SSO provider is configured")
        return SSOValidateResponse(ready=False, reasons=reasons)

    if not provider.enabled:
        reasons.append("Provider is disabled")
    if not provider.client_secret:
        reasons.append("Missing client secret")
    if not provider.claim_mapping:
        reasons.append("No claim mapping configured")

    try:
        await fetch_server_metadata(provider)
    except Exception:
        reasons.append(f"Could not reach the issuer's OIDC discovery document at {provider.issuer}")

    return SSOValidateResponse(ready=not reasons, reasons=reasons)
