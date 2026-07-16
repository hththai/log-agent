import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from app.config import settings

_admin_token_header = APIKeyHeader(name="X-Admin-Token", auto_error=False)


async def require_admin(token: str | None = Depends(_admin_token_header)) -> None:
    """Gate for SSO config/mapping write endpoints (FR-003: restricted access to sensitive settings).

    Uses a shared header token rather than a full session/RBAC system —
    there is no server-side admin session concept yet, and this is the
    smallest change that stops anonymous callers from mutating SSO config.
    """
    if not settings.admin_api_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API token is not configured on the server",
        )
    if not token or not secrets.compare_digest(token, settings.admin_api_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing admin token")
