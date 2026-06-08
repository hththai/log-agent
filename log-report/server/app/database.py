import asyncpg
from fastapi import HTTPException

from app.config import settings

_pool: asyncpg.Pool | None = None


async def connect() -> None:
    global _pool
    dsn = (
        f"postgresql://{settings.db_user}:{settings.db_password}"
        f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    )
    _pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)


async def disconnect() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise HTTPException(status_code=503, detail="Database not ready")
    return _pool
