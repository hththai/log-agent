uvicorn main:app --reload still works unchanged. Final structure:


        server/
        ├── app/
        │   ├── config.py           # Settings + ALLOWED_TABLES constant
        │   ├── database.py         # Pool lifecycle + get_pool dependency
        │   ├── main.py             # App factory (lifespan + routers)
        │   ├── models/
        │   │   └── log.py          # LogEntry, LogsResponse, LogFilter
        │   ├── repositories/
        │   │   └── log.py          # All DB queries in one place
        │   └── routers/
        │       ├── health.py        # GET /health
        │       └── logs.py          # GET /tables, GET /logs/{table}
        └── main.py                  # Entry point → from app.main import app


- `config.py` — settings + `ALLOWED_TABLES` as a frozenset (it's a business constant, not config)
- `database.py` — pool is now a proper async def `get_pool()` FastAPI dependency instead of a global function
- `models/log.py` — `LogFilter` is a dataclass (not Pydantic, not a DB model — just carries query params between layers)
- `repositories/log.py` — all SQL lives here; routes never touch `asyncpg` directly
- `routers/` — each router uses `Depends(get_repo)` for injection; `validate_table` is itself a dependency so FastAPI resolves it before the handler runs
