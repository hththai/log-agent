import asyncpg

from app.models.log import LogEntry, LogFilter


class LogRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    def _where(self, filters: LogFilter) -> tuple[str, list]:
        clauses: list[str] = []
        params: list = []

        def add(clause: str, value):
            params.append(value)
            clauses.append(clause.replace("?", f"${len(params)}"))

        if filters.level:
            add("level = ?", filters.level.upper())
        if filters.status:
            add("status = ?", filters.status)
        if filters.method:
            add("method = ?", filters.method.upper())
        if filters.from_time:
            add("log_time >= ?", filters.from_time)
        if filters.to_time:
            add("log_time <= ?", filters.to_time)

        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        return where, params

    async def list_tables(self) -> list[str]:
        rows = await self._pool.fetch(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name LIKE 'logs_%'
            ORDER BY table_name
            """
        )
        return [r["table_name"] for r in rows]

    async def count(self, table: str, filters: LogFilter) -> int:
        where, params = self._where(filters)
        # table is pre-validated against ALLOWED_TABLES before reaching here
        return await self._pool.fetchval(
            f"SELECT COUNT(*) FROM {table} {where}", *params
        )

    async def list(
        self,
        table: str,
        filters: LogFilter,
        page: int,
        page_size: int,
    ) -> list[LogEntry]:
        where, params = self._where(filters)
        offset = (page - 1) * page_size
        # table is pre-validated against ALLOWED_TABLES before reaching here
        rows = await self._pool.fetch(
            f"""
            SELECT id, log_time, level, ip::text, method, path, status,
                   duration_ms::float, name_service
            FROM {table} {where}
            ORDER BY log_time DESC
            LIMIT {page_size} OFFSET {offset}
            """,
            *params,
        )
        return [LogEntry(**dict(r)) for r in rows]
