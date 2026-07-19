from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.models.sso import (
    AccessMapping,
    AccessMappingInput,
    DemoModeConfig,
    SSOConfigResponse,
    SSOLoginRequest,
    SSOLoginResponse,
    SSOProviderConfig,
    SSOProviderConfigInput,
    SSOValidateResponse,
    UserIdentity,
)
from app.config import settings
from app.security import require_admin
from app.services.access_evaluator import evaluate_access
from app.services.oidc_client import build_oauth_client, fetch_server_metadata
from app.services.sso_store import SsoConfigStore, get_sso_store

router = APIRouter(prefix="/sso", tags=["sso"])

_PROVIDER_UNAVAILABLE = "SSO provider is not configured or enabled"


def _login_error_redirect(message: str) -> RedirectResponse:
    return RedirectResponse(
        f"{settings.client_base_url}/login?error={quote(message)}", status_code=302
    )


def _resolve_identity(provider: SSOProviderConfig, claims: dict) -> UserIdentity:
    """Build a UserIdentity from a verified ID token's claims.

    `claim_mapping` maps our identity field names to the provider's claim
    keys (e.g. {"groups": "https://example.com/groups"}); a field with no
    entry falls back to the claim of the same name.
    """

    def claim(field: str):
        return claims.get(provider.claim_mapping.get(field, field))

    def as_list(value) -> list[str]:
        if not value:
            return []
        return value if isinstance(value, list) else [value]

    return UserIdentity(
        provider_id=provider.id,
        subject=claims.get("sub", "") or claim("email") or "",
        email=claim("email") or "",
        groups=as_list(claim("groups")),
        roles=as_list(claim("roles")),
    )


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


@router.get("/mappings", response_model=list[AccessMapping])
async def get_mappings(store: Annotated[SsoConfigStore, Depends(get_sso_store)]):
    """Public — needed for the sign-in evaluation path to be inspectable."""
    return store.list_mappings()


@router.post("/mappings", response_model=AccessMapping, dependencies=[Depends(require_admin)])
async def save_mapping(
    payload: AccessMappingInput,
    store: Annotated[SsoConfigStore, Depends(get_sso_store)],
):
    if not payload.claim_name or not payload.expected_value or not payload.role:
        raise HTTPException(
            status_code=422,
            detail="claim_name, expected_value, and role are required",
        )
    return store.save_mapping(payload)


@router.post("/login", response_model=SSOLoginResponse)
async def login(
    payload: SSOLoginRequest,
    store: Annotated[SsoConfigStore, Depends(get_sso_store)],
):
    """No admin auth — this is the demo-mode-only sign-in path (FR-007).

    Real-provider access MUST go through the verified `/sso/authorize` ->
    `/sso/callback` redirect flow; this endpoint resolves an identity
    directly from a submitted, unverified email, so it only ever grants
    when demo mode is enabled.
    """
    email = payload.email.strip()
    if not email:
        return SSOLoginResponse(granted=False, reason="Email is required to sign in")

    demo = store.get_demo_mode()

    if not demo.enabled:
        return SSOLoginResponse(granted=False, reason=_PROVIDER_UNAVAILABLE)

    identity = UserIdentity(provider_id="demo", subject=email, email=email)
    policy = evaluate_access(identity, store.list_mappings())

    return SSOLoginResponse(
        granted=policy.allow,
        role=policy.role if policy.allow else None,
        email=email,
        reason=None if policy.allow else policy.description,
    )


@router.get("/authorize")
async def authorize(
    request: Request,
    store: Annotated[SsoConfigStore, Depends(get_sso_store)],
):
    """Production sign-in entry point (FR-009): redirect to the provider's authorization endpoint."""
    provider = store.get_provider_config()
    if provider is None or not provider.enabled:
        raise HTTPException(status_code=503, detail=_PROVIDER_UNAVAILABLE)

    client = build_oauth_client(provider)
    return await client.authorize_redirect(request, provider.redirect_uri)


@router.get("/callback")
async def callback(
    request: Request,
    store: Annotated[SsoConfigStore, Depends(get_sso_store)],
):
    """The provider's configured redirect_uri target (FR-009/FR-010/FR-011).

    Exchanges the code and verifies the ID token via Authlib, evaluates
    access mappings, and either establishes a session + redirects to the
    landing route (grant) or redirects to /login?error=... with no session
    created (denial, missing attribute, or any Authlib exception).
    """
    provider = store.get_provider_config()
    if provider is None or not provider.enabled:
        return _login_error_redirect(_PROVIDER_UNAVAILABLE)

    client = build_oauth_client(provider)
    try:
        token = await client.authorize_access_token(request)
    except Exception as exc:
        return _login_error_redirect(str(exc) or "Sign-in failed")

    identity = _resolve_identity(provider, dict(token.get("userinfo") or {}))
    policy = evaluate_access(identity, store.list_mappings())

    if not policy.allow:
        return _login_error_redirect(policy.description)

    request.session["email"] = identity.email
    request.session["role"] = policy.role
    request.session["provider_id"] = provider.id
    return RedirectResponse(settings.client_base_url + "/", status_code=302)


@router.get("/session", response_model=SSOLoginResponse)
async def get_session(request: Request):
    """Lets the SPA ask "am I signed in?" on load, reading the server-verified session cookie."""
    email = request.session.get("email")
    if not email:
        return SSOLoginResponse(granted=False)
    return SSOLoginResponse(granted=True, role=request.session.get("role"), email=email)


@router.post("/logout")
async def sign_out(request: Request):
    """Clears the session cookie. Idempotent — safe to call with no active session."""
    request.session.clear()
    return {"ok": True}
