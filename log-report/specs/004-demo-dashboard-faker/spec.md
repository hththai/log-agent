# Feature Specification: Demo Dashboard with Faker Data

**Feature Branch**: `004-demo-dashboard-faker`

**Created**: 2026-07-19

**Status**: Draft

**Input**: User description: "I want that if the user click demo button, it will open a demo dashboard similar structure, but using faker data. We can use suitable library such as faker in front end as spa for demo purposes"

## Clarifications

### Session 2026-07-19

- Q: How much sample data should the generated `DemoDataset` contain? → A: Medium sample (~100-300 rows total, spread across the sample services) — supports pagination and makes filtering visibly meaningful.
- Q: How should the system behave if the client-side data-generation library fails to load? → A: Show a lightweight error state ("Demo preview unavailable — please retry") with no dashboard chrome and no fallback data.

## User Scenarios & Testing

### User Story 1 - Explore a realistic demo dashboard without signing in (Priority: P1)

A visitor who is not signed in can click a "Demo" call-to-action and land on a fully interactive dashboard populated with generated sample data, structured the same way as the real protected dashboard (left navigation, filters, report cards/charts), so they can evaluate the reporting experience firsthand before deciding to sign in.

**Why this priority**: This is the core value of the feature — turning today's static demo description into a hands-on preview, which is the main lever for converting visitors into sign-ins.

**Independent Test**: A non-authenticated visitor can click "View demo dashboard" and see a dashboard with left navigation, sample report cards, and charts, with no network calls to the real log API.

**Acceptance Scenarios**:

1. **Given** a visitor is on the public landing/demo section, **When** they click the demo dashboard button, **Then** a dashboard view opens with the same navigation and layout structure as the authenticated dashboard, populated with generated sample data.
2. **Given** the demo dashboard is open, **When** the page loads, **Then** no request is made to the real backend log API — all report data is generated locally.
3. **Given** the visitor is not signed in, **When** they view the demo dashboard, **Then** they are not required to authenticate and remain on the public/unauthenticated experience throughout.

---

### User Story 2 - Apply filters and explore sample report data (Priority: P2)

A visitor exploring the demo dashboard can use the same filters (service, report type, time range) as the real dashboard and see the generated sample data respond accordingly, to understand how filtering and cross-report views work before committing to sign in.

**Why this priority**: This demonstrates the dashboard's actual interactive value — filtering and IP/service views — not just a static preview, which is what differentiates a real demo from a marketing screenshot.

**Independent Test**: A visitor can change the service or report-type filter on the demo dashboard and see the visible sample cards/charts update accordingly, consistent with the selected filter.

**Acceptance Scenarios**:

1. **Given** the demo dashboard is open, **When** the visitor selects a service filter, **Then** only sample report data associated with that service is shown.
2. **Given** the demo dashboard is open, **When** the visitor selects a different report type (e.g., IP report vs. service report), **Then** the visible sample content updates to match, mirroring the real dashboard's report views.

---

### User Story 3 - Understand this is sample data and be prompted to sign in (Priority: P3)

A visitor browsing the demo dashboard can clearly tell the data is illustrative/sample data (not real production data) and has an easy path to sign in for the real experience.

**Why this priority**: Prevents visitors from mistaking generated data for real logs, and keeps the demo focused on converting interest into sign-in, consistent with the existing demo call-to-action pattern.

**Independent Test**: A visitor viewing the demo dashboard can see a persistent label/banner indicating the data is sample/generated, plus a visible sign-in call-to-action.

**Acceptance Scenarios**:

1. **Given** the demo dashboard is open, **When** the visitor views any report screen, **Then** a visible indicator states the data shown is sample/generated data, not live production data.
2. **Given** the visitor wants to proceed, **When** they select the sign-in call-to-action from the demo dashboard, **Then** they are taken to the sign-in flow.

---

### Edge Cases

- What happens when a visitor applies a filter combination that yields no matching sample data (should mirror the real dashboard's empty-state handling)?
- If the client-side data-generation library fails to load (e.g., blocked or failed script), the demo dashboard MUST show a lightweight error state ("Demo preview unavailable — please retry") instead of the dashboard chrome, with no fallback/hard-coded data (see FR-010).
- What happens if a visitor navigates directly to the demo dashboard's URL without clicking the button first (bookmark or shared link)?

## Requirements

### Constitution Alignment

- The demo dashboard MUST remain simple and easy to navigate, matching the low-friction spirit of the existing demo section.
- New or changed logic MUST include a brief unit test strategy or validation note.
- Introducing a faker-style data-generation library MUST be justified as the smallest viable addition and MUST NOT introduce a backend dependency.

### Functional Requirements

- **FR-001**: The system MUST provide a visible "Demo" entry point on the public/unauthenticated landing experience that opens a demo dashboard.
- **FR-002**: The demo dashboard MUST reuse the same structural layout as the authenticated dashboard (left-hand navigation, filters, report cards/charts) established by the log dashboard reporting feature.
- **FR-003**: The demo dashboard MUST be populated entirely with locally generated sample data and MUST NOT call the real backend log API.
- **FR-004**: The demo dashboard MUST be accessible without authentication and MUST NOT require or consume a real user session.
- **FR-005**: The demo dashboard MUST support the same filter interactions (service, report type, time range) as the real dashboard, operating against the generated sample dataset.
- **FR-006**: The system MUST clearly and persistently indicate to the visitor that the demo dashboard displays sample/generated data, not real production data.
- **FR-007**: The demo dashboard MUST provide a visible call-to-action that lets the visitor proceed to the sign-in flow at any point.
- **FR-008**: The system MUST generate approximately 100-300 sample log rows, spread across multiple sample services, covering the same report concepts as the real dashboard (e.g., IP-focused and service-focused reports) — enough volume for pagination and filtering to remain visibly meaningful.
- **FR-009**: The generated sample dataset MUST remain stable and consistent for the duration of a visitor's demo session — the same underlying sample records are used across filter changes within that session, and a fresh dataset is only generated when a new demo session begins (e.g., a full page reload).
- **FR-010**: If the client-side sample-data generation fails (e.g., the generation library fails to load or execute), the system MUST show a lightweight error state ("Demo preview unavailable — please retry") instead of the dashboard chrome, and MUST NOT fall back to hard-coded or partially-generated data.

### Key Entities

- **SampleLogEntry**: A locally generated fake record mirroring the shape of a real log entry (time, level, ip, method, path, status, duration, service), used only within the demo dashboard.
- **DemoDataset**: The in-memory collection of generated `SampleLogEntry` records (approximately 100-300 rows, spread across multiple sample services) and derived summaries backing the demo dashboard's cards and charts for one visitor session.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A visitor can go from the landing page to viewing sample report data in the demo dashboard in a single click, with no sign-in step.
- **SC-002**: The demo dashboard visually and structurally matches the authenticated dashboard's navigation and report layout, so visitors immediately recognize the real product experience.
- **SC-003**: 100% of demo dashboard sessions load and render sample data without any network request to the real log API.
- **SC-004**: A sample-data indicator is visible within 3 seconds of the demo dashboard's first render, so visitors can distinguish demo data from real data without hunting for it.

## Assumptions

- The demo dashboard reuses the dashboard shell/components introduced in feature 002-log-dashboard-reporting (left navigation, filters, report cards) rather than building a separate UI from scratch.
- This feature extends the existing public demo section (002-log-dashboard-reporting FR-006) from static descriptive cards into an actual interactive dashboard experience; the entry point remains the existing demo section surfaced to unauthenticated visitors.
- Sample data reuses the same service/report taxonomy already known to the system (e.g., the service names tracked in `log-agent/services.json`) for realism, but the values themselves are entirely fictional.
- The demo dashboard is read-only; no sample configuration screens or admin actions are exposed there.
- No real user data, credentials, or backend log records are ever fetched or displayed in the demo dashboard.
- A visitor navigating directly to the demo dashboard's URL (without clicking the button first) sees the same demo experience, since it requires no session or prior state.
