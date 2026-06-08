from typing import Annotated

import asyncpg
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.database import get_pool

router = APIRouter(tags=["health"])


@router.get("/health", responses={503: {"description": "Database unavailable"}})
async def health(pool: Annotated[asyncpg.Pool, Depends(get_pool)]):
    try:
        await pool.fetchval("SELECT 1")
        return {"status": "ok"}
    except Exception as e:
        return JSONResponse(status_code=503, content={"status": "error", "detail": str(e)})
