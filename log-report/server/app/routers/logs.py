from datetime import datetime
from typing import Annotated, Optional

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import ALLOWED_TABLES
from app.database import get_pool
from app.models.log import LogEntry, LogFilter, LogsResponse
from app.repositories.log import LogRepository

router = APIRouter(tags=["logs"])


def get_repo(pool: Annotated[asyncpg.Pool, Depends(get_pool)]) -> LogRepository:
    return LogRepository(pool)


def validate_table(table: str) -> str:
    if table not in ALLOWED_TABLES:
        raise HTTPException(status_code=404, detail=f"Table '{table}' not found")
    return table


@router.get("/tables")
async def list_tables(repo: Annotated[LogRepository, Depends(get_repo)]):
    return {"tables": await repo.list_tables()}


@router.get(
    "/logs/{table}",
    response_model=LogsResponse,
    responses={404: {"description": "Table not found"}},
)
async def get_logs(
    table: Annotated[str, Depends(validate_table)],
    repo: Annotated[LogRepository, Depends(get_repo)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=500)] = 50,
    level: Optional[str] = None,
    status: Optional[int] = None,
    method: Optional[str] = None,
    from_time: Optional[datetime] = None,
    to_time: Optional[datetime] = None,
):
    filters = LogFilter(
        level=level,
        status=status,
        method=method,
        from_time=from_time,
        to_time=to_time,
    )
    total = await repo.count(table, filters)
    items = await repo.list(table, filters, page, page_size)
    return LogsResponse(table=table, total=total, page=page, page_size=page_size, items=items)

#count total items by table
@router.get("/{table}/count")
async def get_logs_count(
    table: Annotated[str, Depends(validate_table)],
    repo: Annotated[LogRepository, Depends(get_repo)]
) -> int:
    return await repo.count(table)