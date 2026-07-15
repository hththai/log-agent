# Dashboard API Contract

## Endpoint

### GET /logs
Returns log entries for the dashboard experience.

## Query Parameters
- `page` (optional, integer, default `1`)
- `page_size` (optional, integer, default `50`)
- `level` (optional, string)
- `status` (optional, integer)
- `method` (optional, string)
- `from_time` (optional, datetime)
- `to_time` (optional, datetime)

## Response Shape
```json
{
  "table": "all",
  "total": 100,
  "page": 1,
  "page_size": 50,
  "items": [
    {
      "id": 1,
      "log_time": "2026-07-15T10:00:00Z",
      "level": "INFO",
      "ip": "192.168.0.1",
      "method": "GET",
      "path": "/health",
      "status": 200,
      "duration_ms": 15,
      "name_service": "api"
    }
  ]
}
```

## Notes
- The client will use this endpoint as the source for dashboard cards, charts, and IP-focused reporting.
- The initial implementation does not require new server routes.
