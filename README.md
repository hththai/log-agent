# Log Collector

A log pipeline for OCR services. A Go agent tails log files, parses them, and writes structured records to PostgreSQL. A Python/FastAPI server exposes a REST API to query those records.

```
Log files (host)
      │  bind-mounted (read-only)
      ▼
 log-agent          tail → parse → insert
 (Go)                       │
                             ▼
                        PostgreSQL
                        one table per service
                             │
                             ▼
                    log-report/server
                    (Python / FastAPI)
                    REST query API
```

# Example
![Project Demo](/log-report/demo/demo-desktop2.png)

# Network with service
![Network](/log-report/demo/demo-network.png)

## Components

|                           |                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `log-agent/`              | Go service — watches log files via glob patterns, parses lines (nginx / json / python / csharp / doc), writes to Postgres |
| `log-report/server/`      | FastAPI service — paginated query API over the collected logs                                                             |
| `log-agent/services.json` | Declares which files to watch, which parser to use, and which table to write to                                           |

## Usage with traefik
### With Traefik (full TLS stack)
docker compose --profile traefik up -d

### Without Traefik (e.g. local dev, direct access)
docker compose up -d
