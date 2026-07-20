# Data Model: Dashboard View Switcher

This feature introduces no persisted data, no new API shape, and no change to `LogItem`/`LogsResponse`. The only "entity" is client-side UI state, scoped to a single `LogReportView` mount.

## DashboardViewState

| Field | Type | Notes |
|---|---|---|
| `activeView` | `'table' \| 'diagram'` | Which view group is currently rendered. Defaults to `'table'` on every mount (FR-002). |
| `isPhoneWidth` | `boolean` (derived, not stored) | Result of `window.matchMedia('(min-width: 640px)')` — `false` below the app's existing `sm` breakpoint. Drives both hiding the "Network Diagram" option (FR-006) and the `activeView` auto-fallback (FR-007). Not persisted; recomputed from the live media query on mount and on every `change` event. |

**Purpose**: Tracks which of the two mutually-exclusive view groups (`Table & Chart` vs `Network Diagram`) is visible. Lives entirely inside `LogReportView`'s component state — reset every time the dashboard is mounted, never written to storage, and never sent to a server.

## Relationships to existing data

- `DashboardViewState` is orthogonal to `selectedService` (the existing filter state already in `LogReportView`): switching `activeView` does not read, write, or reset `selectedService`, and vice versa (FR-004, FR-005).
- Both view groups continue to derive their rendered content from the same `LogsResponse`/`LogItem[]` data `LogReportView` already receives as a prop — no new fetch, no new derived dataset, no schema change.
