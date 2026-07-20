# Implementation Plan: Dashboard View Switcher

**Branch**: `005-dashboard-view-switcher` | **Date**: 2026-07-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-dashboard-view-switcher/spec.md`

## Summary

Split the dashboard's two visualizations — the existing "Table & Chart" group (`LogInfoBar` + `LogTable` + `LogPie`) and the existing `LogNetworkGraph` node diagram — into a switchable, single-view-at-a-time layout instead of today's always-stacked page. A new small nav control inside `LogReportView` (shared by the authenticated dashboard and the public `/demo` dashboard) toggles which group renders; both groups keep reading the same already-loaded `data`/`selectedService` state, so no new fetch and no lost filter state. On phone-sized viewports the "Network Diagram" option is hidden from the nav and, if it was active, the view auto-falls-back to "Table & Chart". No new dependency — the nav control is built with existing Tailwind + the app's existing responsive/breakpoint conventions, styled per `ui-ux-pro-max` guidance for a segmented-control/tab pattern.

## Technical Context

**Language/Version**: TypeScript 6 / React 19

**Primary Dependencies**: TanStack Router, Tailwind CSS v4, `lucide-react` (icons, already installed), Recharts (`LogPie`, unchanged), Cytoscape (`LogNetworkGraph`, unchanged) — no new runtime dependency

**Storage**: N/A — purely client-side UI state (which view is active); no data model change

**Testing**: Vitest + `@testing-library/react` (already configured for the client)

**Target Platform**: Web browser, desktop and mobile, served by the existing TanStack Start/Nitro app

**Project Type**: Web application — this feature is frontend-only; no server-side changes

**Performance Goals**: View switch is a local state update with no data fetch or regeneration — must feel instant (no loading indicator needed, matches spec SC-001)

**Constraints**: MUST NOT introduce a new dependency; MUST NOT change `LogReport`'s or `demo.tsx`'s data-fetching/generation behavior; MUST reuse the existing `selectedService` filter state across both views (FR-005); "phone-sized" MUST match the codebase's existing Tailwind breakpoint convention rather than a new custom value

**Scale/Scope**: One new small view-switcher control and its active-view state, added inside `LogReportView.tsx` (the single shared presentational component both dashboard surfaces already use) — no new routes, no new files beyond an optional extracted switcher component and its test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Clean code: feature changes MUST remain readable, typed, and small enough to review.
- Simple UX: user-facing work MUST keep flows obvious and avoid unnecessary steps.
- Simple unit tests: new or changed logic MUST include focused tests where practical.
- Minimal dependencies: new packages MUST be justified and avoid unnecessary stack expansion.

**Initial check**: PASS.
- Clean code: the switcher is a small, single-responsibility addition to `LogReportView` — one piece of local state (`activeView`) and one small control, not a new architectural layer.
- Simple UX: one click/tap to switch views (SC-001); the currently active view is always visually indicated (FR-008); on phone screens the irrelevant option simply isn't offered, rather than being shown and failing.
- Simple unit tests: the switcher's render logic (default view, toggle behavior, filter persistence, phone-breakpoint hiding, and auto-fallback on resize) is small and mockable — see quickstart.md.
- Minimal dependencies: no new package; reuses Tailwind responsive classes/`window.matchMedia` (already used in `ThemeProvider.tsx`) and `lucide-react` (already a dependency) for icons.

**Post-Phase 1 re-check**: PASS — see Complexity Tracking (empty — no violations to justify).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── components/
│   │   └── Log/
│   │       ├── LogReportView.tsx        # existing — gains activeView state + renders the switcher + one view group at a time
│   │       ├── DashboardViewSwitcher.tsx # new — the nav control itself (two options, active-state indicator, phone-breakpoint hiding)
│   │       ├── LogInfoBar.tsx           # existing — unchanged, moves under the "Table & Chart" group
│   │       ├── LogTable.tsx             # existing — unchanged, moves under the "Table & Chart" group
│   │       ├── LogPie.tsx               # existing — unchanged, moves under the "Table & Chart" group
│   │       └── LogNetworkGraph.tsx      # existing — unchanged, moves under the "Network Diagram" group
│   └── routes/
│       ├── demo.tsx      # existing — unchanged; still just renders <LogReportView data={dataset} />
│       └── index.tsx     # existing — unchanged; still just renders <LogReport /> for authenticated users
└── tests/                 # Vitest, colocated *.test.tsx next to the files above
```

**Structure Decision**: Everything lives inside the existing `client/` TanStack Start app, entirely within `LogReportView.tsx` and one new sibling component. Because both the authenticated dashboard (`LogReport` → `LogReportView`) and the public `/demo` route already funnel through `LogReportView`, this single change point delivers the switcher to both surfaces (FR-009) without touching `demo.tsx`, `index.tsx`, or the data-fetching/generation layers at all — matching the plan's "no new fetch, no data-model change" constraint.

## Complexity Tracking

*No constitutional violations — table intentionally left empty.*
