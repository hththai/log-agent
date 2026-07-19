# Contract: Demo Data Generator

This feature has no backend/API surface (FR-003) — the only interface worth pinning down is the internal one between the new data generator and the reused `LogReportView` component.

## `generateDemoLogsResponse(): LogsResponse`

**Location**: `client/src/api/demoLog.ts`

**Signature**: Takes no arguments, synchronously returns a `LogsResponse` (same type as exported from `client/src/api/log.tsx`) — or throws, on generation failure.

### Guarantees

- `items.length` is between 100 and 300 inclusive (FR-008).
- Every item is a fully-populated `LogItem` — no field is `null`/`undefined` (unlike real log rows, which may have null `ip`/`method`/`status` for non-HTTP lines; the demo dataset always fills every field so every report view has something to render).
- `items` are distributed across all three sample service names (`ocr_api`, `ocr_client`, `doc_invoice`) — no service has zero rows, so service-filtering (FR-005) always has a visible effect for each option.
- `table` is always the literal string `"demo"`.
- `page` is always `1`; `page_size` always equals `items.length`.
- Calling it twice produces two different datasets (values are freshly randomized each call) — session stability (FR-009) is the caller's responsibility (see data-model.md and research.md §5: the route calls this once via a lazy `useState` initializer, not on every render).

### Failure mode

- May throw (e.g., if the underlying `@faker-js/faker` module fails to evaluate). Callers MUST catch this and render the FR-010 error state ("Demo preview unavailable — please retry") rather than letting the exception propagate to the route boundary.

### Consumers

- `client/src/routes/demo.tsx` — the only caller. Passes the result directly to `LogReportView` as its `data` prop, identical to how `LogReport` passes a real `useQuery(getLogs)` result today.
