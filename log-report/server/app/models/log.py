from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LogEntry(BaseModel):
    id: int
    log_time: datetime
    level: Optional[str] = None
    ip: Optional[str] = None
    method: Optional[str] = None
    path: Optional[str] = None
    status: Optional[int] = None
    duration_ms: Optional[float] = None
    name_service: Optional[str] = None


class LogsResponse(BaseModel):
    table: str
    total: int
    page: int
    page_size: int
    items: list[LogEntry]


@dataclass
class LogFilter:
    level: str | None = None
    status: int | None = None
    method: str | None = None
    from_time: datetime | None = None
    to_time: datetime | None = None
