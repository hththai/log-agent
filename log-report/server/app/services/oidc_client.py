from authlib.integrations.starlette_client import OAuth, StarletteOAuth2App

from app.models.sso import SSOProviderConfig


def build_oauth_client(config: SSOProviderConfig) -> StarletteOAuth2App:
    """Build a per-request Authlib OIDC remote app from a stored provider config.

    Authlib's OAuth() registry is normally populated once at startup with
    static clients; our provider config is admin-editable at runtime, so
    each call creates a fresh registry with just the active provider
    registered under its own id. Used by the authorize/callback sign-in
    endpoints (User Story 2) and by POST /sso/validate for a live
    discovery-document check.
    """
    oauth = OAuth()
    oauth.register(
        name=config.id,
        client_id=config.client_id,
        client_secret=config.client_secret,
        server_metadata_url=f"{config.issuer.rstrip('/')}/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    return oauth.create_client(config.id)


async def fetch_server_metadata(config: SSOProviderConfig) -> dict:
    """Fetch the issuer's OIDC discovery document.

    Raises on network failure or an invalid document — callers (e.g.
    POST /sso/validate) turn that into a not-ready reason rather than a 500.
    """
    client = build_oauth_client(config)
    return await client.load_server_metadata()
