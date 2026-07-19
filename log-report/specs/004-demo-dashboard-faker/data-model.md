# Data Model: Demo Dashboard with Faker Data

Both entities are generated client-side only and deliberately mirror the existing `LogItem`/`LogsResponse` shapes already defined in `client/src/api/log.tsx`, so the generated data is a drop-in for `LogReportView` with no adapter code.

## SampleLogEntry

Maps 1:1 onto the existing `LogItem` type — no new fields, no renaming.

| Field | Type | Notes |
|---|---|---|
| `id` | number | Sequential or random unique integer within the generated set |
| `log_time` | string (ISO 8601) | Randomly distributed across a recent, bounded time window (e.g., last 7 days) so time-range filtering has something to show |
| `level` | string | One of the real system's known levels (`INFO`, `WARN`, `ERROR`) |
| `ip` | string | Faker-generated IPv4 address; mix of internal (`10.x`, `192.168.x`) and external ranges so `LogIpReport`'s internal/external split has both to show |
| `method` | string | One of `GET`, `POST`, `PUT`, `DELETE` |
| `path` | string | Faker-generated URL path fragment |
| `status` | number | Realistic HTTP status code, weighted toward 2xx with some 4xx/5xx |
| `duration_ms` | number | Faker-generated positive float |
| `name_service` | string | One of the sample service names (see DemoDataset below) |

**Purpose**: A single fake log line, shaped identically to a real backend log row, used only within the demo dashboard.

## DemoDataset

Maps 1:1 onto the existing `LogsResponse` type.

| Field | Type | Notes |
|---|---|---|
| `table` | string | Fixed value `"demo"` — distinguishes this from any real table name |
| `total` | number | Equal to `items.length` |
| `page` | number | Fixed at `1` — the demo dataset is not paginated server-side; `LogTable`'s existing client-side pagination handles paging over the full in-memory array |
| `page_size` | number | Equal to `items.length` |
| `items` | `SampleLogEntry[]` | 100-300 generated rows (per spec FR-008), spread across 3 sample service names |

**Sample service names**: reuses the real service identifiers already tracked in `log-agent/services.json` (`ocr_api`, `ocr_client`, `doc_invoice`) as `name_service` values, per the spec's Assumptions — the labels are real, the data behind them is not.

**Purpose**: The full generated response object held in the `/demo` route's component state for one visitor session; fed directly into `LogReportView` in place of a real `useQuery(getLogs)` result.

## Relationships

- A `DemoDataset` contains many `SampleLogEntry` records.
- `LogReportView` derives its cards, table rows, pie chart, IP report, and network graph from a `DemoDataset` exactly as it does from a real `LogsResponse` — no demo-specific branching inside `LogReportView` itself.
- The `/demo` route owns exactly one `DemoDataset` instance for the lifetime of its mount (see research.md §5).
