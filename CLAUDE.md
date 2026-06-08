# Log Collector — Project Guide

## What this does

Collects log files from OCR services, parses and stores them in PostgreSQL, and exposes a query API.

```
Log files (host)
      │
      ▼
  log-agent          (Go) — tails files, parses lines, writes to Postgres
      │
      ▼
  PostgreSQL          shared DB, one table per service
      │
      ▼
  log-report/server  (Python/FastAPI) — REST API to query logs
```

## Components

| Folder | Lang | Role |
|---|---|---|
| `log-agent/` | Go | File tailer + parser + DB writer |
| `log-report/server/` | Python | FastAPI query API |
| `db-log-agent/` | — | Postgres-only compose (dev convenience) |

---

## Services tracked

Defined in `log-agent/services.json` — **the source of truth for which tables exist**.

| name | parser | table |
|---|---|---|
| ocr_api | json | `logs_ocr_api` |
| ocr_client | json | `logs_ocr_client` |
| doc_invoice | doc | `logs_doc_invoice` |

**Important:** `ALLOWED_TABLES` in `log-report/server/app/config.py` must stay in sync with this file.

---

## Database schema

Every service gets its own table, created on first write by the Go agent:

```sql
CREATE TABLE <table_name> (
    id           SERIAL PRIMARY KEY,
    log_time     TIMESTAMP WITH TIME ZONE NOT NULL,
    level        VARCHAR(10),
    ip           INET,           -- NULL for non-HTTP lines
    method       VARCHAR(10),    -- NULL for non-HTTP lines
    path         TEXT,
    status       INT,            -- NULL for non-HTTP lines
    duration_ms  NUMERIC(10, 2),
    raw_payload  TEXT NOT NULL,  -- original line, always present
    name_service VARCHAR(25)
);
CREATE INDEX ON <table_name>(log_time DESC);
```

---

## Docker network

All services share one external bridge network: **`logging-network`**.

Create it once before starting any stack:
```bash
docker network create logging-network
```

---

## Running the stack

### 1. Start the database
```bash
cd log-agent
docker compose -f docker-compose.db.yml up -d
```

### 2. Start the log agent
```bash
cd log-agent
cp .env.example .env   # fill in real values
docker compose up -d
```

### 3. Start the report API
```bash
cd log-report
cp ../log-agent/.env .env          # same POSTGRES_* vars, add SERVER_PORT=8000
docker compose up -d
```

API available at `http://localhost:8000` — docs at `/docs`.

---

## log-agent env vars

| Var | Description |
|---|---|
| `POSTGRES_USER` | DB username |
| `POSTGRES_PASSWORD` | DB password |
| `POSTGRES_DB` | DB name |
| `POSTGRES_HOST` | DB host (container name `log_postgres` in Docker) |
| `OCR_PROJECT_LOG_DIR` | Host path → mounted at `/incoming-logs/api` |
| `OCR_PROJECT_LOG_CLIENT` | Host path → mounted at `/incoming-logs/client` |
| `OCR_DOC_INVOICE` | Host path → mounted at `/incoming-logs/applog` |
| `APP_ENV=local` | Set to load `.env.local` for local dev |

## log-report env vars

| Var | Description |
|---|---|
| `DB_HOST` | Postgres host (`log_postgres` in Docker, `localhost` locally) |
| `DB_PORT` | Default `5432` |
| `DB_USER` | Same as `POSTGRES_USER` |
| `DB_PASSWORD` | Same as `POSTGRES_PASSWORD` |
| `DB_NAME` | Same as `POSTGRES_DB` |
| `SERVER_PORT` | Exposed port, default `8000` (docker-compose only) |

---

## log-report/server — Python project

**Run locally:**
```bash
cd log-report/server
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DB_HOST=localhost
uvicorn main:app --reload
```

**Package structure:**
```
app/
├── config.py          # Settings (pydantic-settings) + ALLOWED_TABLES
├── database.py        # asyncpg pool lifecycle + get_pool() dependency
├── main.py            # FastAPI app factory + lifespan
├── models/log.py      # LogEntry, LogsResponse (Pydantic), LogFilter (dataclass)
├── repositories/log.py  # All SQL — never called directly from routers
└── routers/
    ├── health.py      # GET /health
    └── logs.py        # GET /tables, GET /logs/{table}
main.py                # Entry point: from app.main import app
```

**Adding a new service/table:**
1. Add entry to `log-agent/services.json`
2. Add table name to `ALLOWED_TABLES` in `log-report/server/app/config.py`

---

## log-agent — Go project

- Entry: `log-agent/main.go` — reads `services.json`, spawns one goroutine per discovered file
- Checkpoint: `/state/file-offsets.json` — persists byte offsets so restarts don't re-ingest old lines
- Parsers: `internal/api_ocr_log/parser/` — `json`, `nginx`, `python`, `csharp`, `doc`
- Tables are auto-created on first write (no migrations needed)
- Local dev: set `APP_ENV=local` to load `.env.local`
