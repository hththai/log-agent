from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "postgres"
    db_password: str = ""
    db_name: str = "logs"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Business constant — not runtime config, not user-tunable
ALLOWED_TABLES: frozenset[str] = frozenset({
    "logs_ocr_api",
    "logs_ocr_client",
    "logs_doc_invoice",
})
