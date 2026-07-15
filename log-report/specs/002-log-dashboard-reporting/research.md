# Research: Log Dashboard Reporting

## Decision: Use the existing Python log API as the data source

**Rationale**: The server already exposes `/logs` and `/logs/{table}` with filtering support for level, status, method, and time range. Reusing that endpoint keeps the implementation simple and aligned with the minimal-dependency principle.

**Alternatives considered**:
- Adding a new backend endpoint for dashboard aggregation — rejected because it adds server work without proving a clear need for v1.
- Building the dashboard entirely from mock data — rejected because it would not validate the real backend integration.

## Decision: Use a lightweight SSO-style session for v1

**Rationale**: The clarified requirement calls for a secure experience without introducing a real identity provider dependency. An email-based sign-in flow is enough for the initial version and keeps the scope manageable.

**Alternatives considered**:
- Real OIDC/OAuth integration — rejected because it adds infrastructure and operational overhead.
- A mock-only gate — rejected because it does not provide a realistic secured experience.

## Decision: Use Tailwind CSS and a simple theme context for dark mode

**Rationale**: The client already uses Tailwind, and a lightweight theme toggle can be implemented without adding new UI libraries. The dark mode option will be a simple class-based toggle with a persisted preference.

**Alternatives considered**:
- Custom CSS modules only — rejected because the project already benefits from Tailwind and it would add more manual styling work.
- A third-party theme library — rejected because it would increase dependency overhead.

## Decision: Keep tests focused on the most important behavior

**Rationale**: The constitution calls for simple unit tests and only the behavior that would be most valuable to protect. The initial test scope will cover auth gating, theme preference persistence, and filter state changes.

**Alternatives considered**:
- Broad component and end-to-end coverage — rejected because it would slow implementation without providing much added value for v1.
