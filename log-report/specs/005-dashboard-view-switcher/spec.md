# Feature Specification: Dashboard View Switcher

**Feature Branch**: `[005-dashboard-view-switcher]`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "Add a view-switcher navigation to the log dashboard with two options: one showing the current table and pie chart view, and another showing the node diagram view. On phone-sized devices, the node diagram option should not be shown/available. Use the ui-ux-pro-max skill for UI/UX design decisions under the client folder."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch between table/chart and network diagram views (Priority: P1)

A dashboard viewer wants to focus on either the tabular/summary view of log data (info bar, table, pie chart) or the network relationship view (node diagram), one at a time, instead of scrolling past both on a single long page.

**Why this priority**: This is the core of the feature — without it there is no switcher, just the status quo of both views stacked on one page.

**Independent Test**: Load the dashboard, confirm the "Table & Chart" view is shown by default, select the "Network Diagram" navigation option, confirm the node diagram is now shown and the table/chart view is hidden, then switch back and confirm the table/chart view returns.

**Acceptance Scenarios**:

1. **Given** a viewer has just loaded the dashboard on a desktop-sized screen, **When** the page renders, **Then** the "Table & Chart" view (info bar, table, pie chart) is visible and the "Network Diagram" view is not.
2. **Given** the "Table & Chart" view is active, **When** the viewer selects the "Network Diagram" navigation option, **Then** the node diagram becomes visible and the table/chart content is hidden.
3. **Given** the "Network Diagram" view is active, **When** the viewer selects the "Table & Chart" navigation option, **Then** the table/chart content becomes visible again and the node diagram is hidden.

---

### User Story 2 - Filters and data stay consistent across views (Priority: P2)

A dashboard viewer who has filtered the data (e.g., by clicking a service slice in the pie chart) expects that filter to still apply if they switch views and come back, rather than losing their place.

**Why this priority**: Preserves the existing filtering behavior (already relied on by both the authenticated and demo dashboards) so the new navigation doesn't regress existing functionality.

**Independent Test**: On the "Table & Chart" view, select a service filter, switch to "Network Diagram" and back to "Table & Chart", and confirm the same filter is still applied.

**Acceptance Scenarios**:

1. **Given** a viewer has selected a service filter on the "Table & Chart" view, **When** they switch to the "Network Diagram" view and back, **Then** the previously selected filter is still applied.
2. **Given** a viewer switches views, **When** the switch happens, **Then** no new data is fetched or regenerated — the same underlying dataset is reused for both views.

---

### User Story 3 - Network diagram option is unavailable on phone-sized screens (Priority: P1)

A dashboard viewer on a phone-sized screen should not be offered the "Network Diagram" option at all, since the node diagram is not designed to be usable at that size.

**Why this priority**: Explicitly requested constraint; without it, phone users could select a view that renders poorly, harming usability.

**Independent Test**: Load the dashboard at a phone-sized viewport width and confirm only the "Table & Chart" option is shown in the navigation (no "Network Diagram" option is visible or selectable).

**Acceptance Scenarios**:

1. **Given** a viewer loads the dashboard on a phone-sized screen, **When** the navigation renders, **Then** only the "Table & Chart" option is shown; the "Network Diagram" option is absent.
2. **Given** a viewer has the "Network Diagram" view active on a larger screen, **When** they resize or rotate the device down to a phone-sized width, **Then** the dashboard automatically falls back to the "Table & Chart" view and the "Network Diagram" option disappears from the navigation.

---

### Edge Cases

- What happens if a viewer is on the "Network Diagram" view and shrinks the browser window (not a real device, just a resize) below the phone-sized breakpoint? System falls back to the "Table & Chart" view automatically (see US3, Scenario 2).
- What happens if there is no data to show in either view? Existing empty/loading states for the table, pie chart, and network diagram are unchanged — the switcher only controls which already-existing view is visible.
- What happens on tablet-sized screens? Both options remain available; the "phone-sized" restriction applies only at the phone breakpoint, not tablet or larger.

## Requirements *(mandatory)*

### Constitution Alignment *(mandatory)*

- Features MUST preserve a simple, low-friction user experience.
- New or changed logic MUST include a brief unit test strategy or validation note.
- Changes that introduce new dependencies MUST identify the reason and maintenance impact.

### Functional Requirements

- **FR-001**: The dashboard MUST provide a navigation control with two options: "Table & Chart" (the existing info bar, table, and pie chart) and "Network Diagram" (the existing node diagram).
- **FR-002**: The "Table & Chart" option MUST be the default active view when the dashboard first loads.
- **FR-003**: Selecting a navigation option MUST show only that view's content and hide the other view's content — the two views are not both visible at once.
- **FR-004**: Switching between views MUST NOT trigger a new data fetch or regenerate the sample/demo dataset; both views MUST read from the same already-loaded data.
- **FR-005**: Any filter selection made in the "Table & Chart" view (e.g., service filter) MUST remain applied when the viewer switches to "Network Diagram" and back.
- **FR-006**: On phone-sized viewports, the "Network Diagram" navigation option MUST NOT be shown or selectable.
- **FR-007**: If the viewport is resized or rotated down to a phone-sized width while "Network Diagram" is active, the dashboard MUST automatically switch to the "Table & Chart" view.
- **FR-008**: The navigation control MUST visually indicate which view is currently active.
- **FR-009**: This navigation control MUST be available on every dashboard surface that currently renders both the table/chart and network diagram content together (the authenticated dashboard and the public demo dashboard), since both reuse the same shared view component.
- **FR-010**: The navigation control's visual design (layout, spacing, color, typography) MUST be produced using the project's UI/UX design skill and MUST remain visually consistent with the rest of the application (light and dark mode).

### Key Entities

- **Dashboard View**: One of two mutually-exclusive display modes for already-loaded log data — "Table & Chart" or "Network Diagram". Not a data entity; a UI-state concept scoped to a single dashboard session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A viewer can switch from one view to the other in a single interaction (one click or tap), with the new view visible immediately (no visible loading delay, since no new data is fetched).
- **SC-002**: On phone-sized screens, the "Network Diagram" option is absent from the navigation in 100% of page loads and after 100% of resize/rotation events into that size range.
- **SC-003**: A filter applied before switching views is still applied after switching back, in 100% of manual test passes.
- **SC-004**: A viewer can identify the currently active view without needing to scroll or guess, in 100% of usability spot-checks (i.e., an always-visible active-state indicator).

## Assumptions

- "Phone-sized devices" maps to the smallest responsive breakpoint already used elsewhere in the client app's Tailwind-based responsive design (i.e., consistent with the existing mobile breakpoint convention, not a newly invented threshold).
- "Current table and pie chart view" refers to the existing info bar + table + pie chart combination already rendered together; "node diagram" refers to the existing network graph component. No changes to those components' internal behavior are in scope — only how/when they are shown.
- This feature applies uniformly to both the authenticated dashboard and the public demo dashboard, since they share the same underlying presentational component and dataset-loading is already decoupled from rendering.
- No backend or API changes are required — this is a client-side, view-organization change only.
- Existing filter state (service selection) is the only cross-view state that needs to persist; no new filter types are introduced by this feature.
