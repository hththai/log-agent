# Quickstart: Dashboard View Switcher

## Prerequisites

- Node/pnpm set up for the client (see repo root `client/` for the existing dev workflow).
- No backend, database, or `.env` changes required — this feature is purely client-side UI state.

## Run

```bash
cd client
pnpm install
pnpm dev
```

Open `http://localhost:3000/demo` (no sign-in required) — or sign in and view the authenticated dashboard at `/` — both render the same `LogReportView` this feature changes.

## Validation scenarios

### 1. Default view on load (FR-002, SC-001)

- Load the dashboard on a desktop-sized window.
- **Expected**: the "Table & Chart" group (info bar, table, pie chart) is visible; "Network Diagram" is not. The switcher shows "Table & Chart" as active.

### 2. Switching views (FR-001, FR-003, SC-001)

- Click the "Network Diagram" option in the switcher.
- **Expected**: the node diagram becomes visible; the table/chart group disappears. No loading spinner or delay — the switch is instant (no new fetch, see contracts/dashboard-view-switcher.md).
- Click "Table & Chart" again.
- **Expected**: the table/chart group returns; the diagram disappears.

### 3. Filter persists across a view switch (FR-004, FR-005, SC-003)

- On the "Table & Chart" view, click a service slice in the pie chart to filter.
- Switch to "Network Diagram" and back to "Table & Chart".
- **Expected**: the same service filter is still applied (info bar counts and table rows still narrowed).

### 4. Network Diagram hidden on phone-sized screens (FR-006, SC-002)

- Resize the browser window to a phone width (below the app's existing `sm` breakpoint, 640px — e.g. use devtools' device toolbar at 375px).
- **Expected**: only the "Table & Chart" option is visible in the switcher; "Network Diagram" is absent (not present in the DOM, not just visually hidden).

### 5. Auto-fallback on resize into phone width (FR-007)

- On a desktop-sized window, switch to "Network Diagram".
- Resize the window down below 640px (or rotate a device emulation down to phone width).
- **Expected**: the dashboard automatically falls back to "Table & Chart"; the "Network Diagram" option disappears from the switcher at the same time.

### 6. Active view is always identifiable (FR-008, SC-004)

- At any point, glance at the switcher.
- **Expected**: the currently active option has a clearly different visual treatment (filled background), not just a subtle color change — confirm this holds in both light and dark mode.

### 7. Available on both dashboard surfaces (FR-009)

- Repeat scenario 2 on the authenticated dashboard (`/` while signed in) and on the public `/demo` route.
- **Expected**: identical switcher behavior on both, since both render `LogReportView`.

## Automated checks

- `pnpm test` (Vitest) should include:
  - A `DashboardViewSwitcher` (or `LogReportView`) test asserting the default active view is "Table & Chart" and that clicking toggles which group renders.
  - A test asserting `selectedService` filter state survives a view switch (extends `LogReportView.test.tsx`).
  - A test mocking `window.matchMedia` to simulate phone width, asserting the "Network Diagram" option is absent and that switching the mocked media query to phone width while on "Network Diagram" falls back to "Table & Chart".
