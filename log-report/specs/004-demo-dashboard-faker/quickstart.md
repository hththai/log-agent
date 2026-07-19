# Quickstart: Demo Dashboard with Faker Data

## Prerequisites

- Node/pnpm set up for the client (see repo root `client/` for the existing dev workflow).
- No backend, database, or `.env` setup required — this feature makes zero network calls.

## Run

```bash
cd client
pnpm install   # picks up @faker-js/faker, already declared in package.json
pnpm dev
```

Open `http://localhost:3000/` in a fresh/incognito browser session (no existing auth session).

## Validation scenarios

### 1. Demo entry point is reachable without signing in (FR-001, SC-001)

- Visit `/` while signed out.
- **Expected**: a public landing view renders (not a redirect to `/login`), with a visible "View demo dashboard" link.
- Click it.
- **Expected**: you land on `/demo` in a single click, no sign-in prompt.

### 2. No real API traffic (FR-003, SC-003)

- With browser devtools' Network tab open, reload `/demo`.
- **Expected**: zero requests to `/logs` or any `http://localhost:8000/*` / `/api/*` path. Every request is for static assets only.

### 3. Structural reuse (FR-002, SC-002)

- Compare `/demo` against the real dashboard content rendered on `/` when signed in (info cards, table, pie chart, IP report, network graph).
- **Expected**: the same components in the same arrangement — because both render the same `LogReportView`, see data-model.md and research.md §2.

### 4. Filtering works against sample data (FR-005)

- On `/demo`, click a slice of the service pie chart, or use the table's service filter.
- **Expected**: the info cards, table rows, and other views narrow to that service's sample rows only — matching contracts/demo-data-generator.md's guarantee that every sample service has visible rows.

### 5. Sample-data indicator and sign-in path (FR-006, FR-007, SC-004)

- On `/demo`, without interacting further, note whether a "sample data" indicator is visible.
- **Expected**: visible within 3 seconds of first render (in practice, immediately — it's static, not loaded async).
- Click the sign-in call-to-action.
- **Expected**: navigates to `/login`.

### 6. Dataset stability within a session (FR-009)

- On `/demo`, note a specific value (e.g., total request count in the info bar).
- Apply and then clear a filter.
- **Expected**: the underlying total/dataset is unchanged — only the visible subset changes.
- Reload the page.
- **Expected**: the dataset regenerates (values may differ from before reload).

### 7. Generation-failure fallback (FR-010)

- Not practically triggerable by hand in a normal run; validate via a unit test that mocks `generateDemoLogsResponse` (contracts/demo-data-generator.md) to throw, and asserts the route renders "Demo preview unavailable — please retry" instead of the dashboard chrome.

## Automated checks

- `pnpm test` (Vitest) should include:
  - A generator test asserting `items.length` is within 100-300 and every sample service is represented (contracts/demo-data-generator.md).
  - A `/demo` route test asserting no `fetch`/`getLogs` call occurs on render.
  - A `/demo` route test covering the generation-failure error state (scenario 7 above).
