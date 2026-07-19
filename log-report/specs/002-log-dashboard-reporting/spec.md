# Feature Specification: Log Dashboard Reporting

**Feature Branch**: `002-log-dashboard-reporting`

**Created**: 2026-07-15

**Status**: Draft

**Input**: User description: "I want to build a log dash board to report, filter and showing ip reports from different services. the dashboard can be filtered cross reports. The web is implementing SSO login and secured authentication. Menu bar is from the left. The web is responsive. It will show differently on desktop and phone. The web also have a demo section for who is not login."

## User Scenarios & Testing

### User Story 1 - Explore protected dashboard reports (Priority: P1)

A signed-in analyst can open the application and review log reporting data across services without needing to navigate through multiple screens.

**Why this priority**: Access to the reporting experience is the primary value of the feature and the foundation for all other interactions.

**Independent Test**: A signed-in user can open the dashboard, view reports, and apply filters without needing to leave the main experience.

**Acceptance Scenarios**:

1. Given an authenticated user, When they open the application, Then they are taken to the protected dashboard experience.
2. Given the dashboard is open, When the user selects filters for service, time range, or report type, Then the visible report content updates accordingly.
3. Given the user is not authenticated, When they attempt to access the dashboard, Then they are redirected to a sign-in flow or an access gate.

### User Story 2 - Review IP and service-based insights (Priority: P2)

A user can review IP-focused reports and understand activity across different services from a single dashboard view.

**Why this priority**: This provides the reporting detail that makes the dashboard useful for investigation and operations review.

**Independent Test**: A user can switch between report views and inspect IP-related data for different services.

**Acceptance Scenarios**:

1. Given a dashboard view is open, When the user selects an IP report or a service report, Then the relevant report data is displayed.
2. Given multiple services are available, When the user filters by service, Then the report content reflects only the selected service context.

### User Story 3 - Experience the demo experience before login (Priority: P3)

A visitor can view a public demo section that explains the product and highlights key reporting capabilities before signing in.

**Why this priority**: The demo section improves first-time understanding and encourages sign-in without blocking access to basic information.

**Independent Test**: A non-authenticated visitor can view public content describing the product and its reporting capabilities.

**Acceptance Scenarios**:

1. Given a visitor is not signed in, When they open the landing experience, Then they can access a demo section that explains the product.
2. Given the visitor is signed in, When they open the same experience, Then they can continue to the dashboard without losing access to the demo content.

### Edge Cases

- What happens when a user applies filters that return no matching report data?
- How does the system handle an authentication failure or a session that expires during use?

## Requirements

### Constitution Alignment

- The experience MUST remain simple and easy to navigate.
- The reporting dashboard MUST remain usable across mobile and desktop layouts.
- New or changed logic MUST include a brief unit test strategy or validation note.
- The implementation MUST avoid unnecessary dependencies and keep the code clear.

### Functional Requirements

- **FR-001**: The system MUST provide an authenticated dashboard access experience. For v1 this was a lightweight, email-based sign-in flow; production sign-in is now defined by feature 003-sso-configuration (FR-009–FR-011), which requires a real IdP redirect flow with verified-token evaluation. The email-based flow described here is retained only as the demo-mode fallback specified in 003-FR-007.
- **FR-002**: The system MUST support a protected dashboard area that requires authentication.
- **FR-003**: The system MUST display a left-hand menu for navigating the dashboard.
- **FR-004**: The system MUST support filtering reports across services, time ranges, and report types.
- **FR-005**: The system MUST display IP-related reporting information for multiple services.
- **FR-006**: The system MUST provide a public demo section for users who are not logged in.
- **FR-007**: The system MUST adapt the layout for desktop and phone experiences without hiding critical controls.

## Success Criteria

### Measurable Outcomes

- **SC-001**: An authenticated user can reach the dashboard and apply a filter in under 2 minutes.
- **SC-002**: The dashboard remains usable at mobile and desktop widths without overlapping or hidden key controls.
- **SC-003**: Users can switch between report views and understand the current filter context without assistance.

## Assumptions

- The dashboard uses existing log data and report structures available in the current application.
- Authentication was represented as a lightweight SSO-style session using an email-based sign-in flow for the initial v1 implementation. This has since been superseded for production sign-in by feature 003-sso-configuration's redirect-based OAuth flow (FR-009); the email-based flow now serves only as the local demo-mode fallback.
- The demo section is informational and does not replace the authenticated reporting experience.
