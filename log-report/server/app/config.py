import re

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = ""
    db_name: str = "logs"

    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # SSO configuration (feature 003)
    sso_client_secret: str = ""
    sso_config_path: str = "app/data/sso_config.json"
    admin_api_token: str = ""
    session_secret_key: str = ""
    # Base URL of the client SPA. GET /sso/callback is reached by the browser
    # navigating directly to this API's own origin (the provider redirect_uri),
    # so its post-login redirects must be absolute — a relative "/login" would
    # resolve against this API's origin, not the SPA's (they differ in dev).
    client_base_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

_TABLE_RE = re.compile(r"^logs_[a-z0-9_]+$")


def is_safe_table_name(name: str) -> bool:
    return bool(_TABLE_RE.match(name))
