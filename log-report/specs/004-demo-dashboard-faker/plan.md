# Implementation Plan: Demo Dashboard with Faker Data

**Branch**: `004-demo-dashboard-faker` | **Date**: 2026-07-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-demo-dashboard-faker/spec.md`

## Summary

Give unauthenticated visitors a real, interactive dashboard preview instead of today's dead end (`/` currently redirects any signed-out visitor straight to `/login`). A new public `/demo` route renders the same report components the authenticated experience uses (`LogInfoBar`, `LogTable`, `LogPie`, `LogIpReport`, `LogNetworkGraph`), fed by a client-side, `@faker-js/faker`-generated dataset shaped exactly like the real `/logs` API response — so no backend call, no auth, and no new runtime dependency (faker is already installed and unused). `LogReport` is split into a thin data-fetching wrapper and a new presentational `LogReportView` so the real and demo paths render identical UI code, not a parallel copy.

## Technical Context

**Language/Version**: TypeScript 6 / React 19

**Primary Dependencies**: TanStack Start/Router, @tanstack/react-query, @tanstack/react-table, Recharts, Cytoscape, Tailwind CSS v4, `@faker-js/faker` (already in `client/package.json`, currently unused — no new install required)

**Storage**: N/A — the demo dataset is generated and held in memory in the browser only; no backend, database, or network call is involved

**Testing**: Vitest + `@testing-library/react` (already configured for the client)

**Target Platform**: Web browser, desktop and mobile, served by the existing TanStack Start/Nitro app

**Project Type**: Web application — this feature is frontend-only; no server-side changes

**Performance Goals**: Generate and render a ~100-300 row sample dataset synchronously on route mount with no perceptible delay; no numeric latency target beyond that (matches spec's Success Criteria, no additional target needed)

**Constraints**: MUST NOT call the real `/logs` API (FR-003); MUST NOT add a new dependency (faker is already present); MUST NOT change the behavior of the authenticated `/` and `/dashboard` routes for signed-in users

**Scale/Scope**: One new public route (`/demo`), a minimal fix to `index.tsx`'s unauthenticated branch so FR-001 has a home, one small extraction inside `LogReport.tsx`, and one new client-side data-generator module

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Clean code: feature changes MUST remain readable, typed, and small enough to review.
- Simple UX: user-facing work MUST keep flows obvious and avoid unnecessary steps.
- Simple unit tests: new or changed logic MUST include focused tests where practical.
- Minimal dependencies: new packages MUST be justified and avoid unnecessary stack expansion.

**Initial check**: PASS.
- Clean code: the only structural change to existing code is extracting `LogReportView` (presentational) out of `LogReport` (data-fetching) — a single-responsibility split, not a new abstraction layer.
- Simple UX: one click from the landing view to a working demo (SC-001); a persistent, non-intrusive sample-data banner and sign-in CTA reuse the same visual language as `login.tsx`.
- Simple unit tests: the data generator (row count, required fields) and the `/demo` route (no network call, error-state fallback) are each small, focused, mockable units — see quickstart.md.
- Minimal dependencies: `@faker-js/faker` is already an installed, unused dependency — this feature activates it rather than adding anything new.

**Post-Phase 1 re-check**: PASS — no design decision introduced a new dependency, a new backend surface, or a deviation from the constitution. See Complexity Tracking (empty — no violations to justify).

## Project Structure

### Documentation (this feature)

```text
specs/004-demo-dashboard-faker/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/             # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── api/
│   │   ├── log.tsx           # existing — LogItem/LogsResponse types reused as-is
│   │   └── demoLog.ts         # new — generateDemoLogsResponse(): LogsResponse (faker-backed)
│   ├── components/
│   │   └── Log/
│   │       ├── LogReport.tsx      # existing — becomes a thin useQuery(getLogs) wrapper
│   │       └── LogReportView.tsx  # new — presentational, data-in; used by LogReport and /demo
│   └── routes/
│       ├── index.tsx    # existing — unauthenticated branch gets a landing view + Demo CTA instead of an empty redirect
│       └── demo.tsx      # new — public route: sample-data banner, LogReportView, sign-in CTA
└── tests/                 # Vitest, colocated *.test.tsx next to the files above
```

**Structure Decision**: Everything lives in the existing `client/` TanStack Start app; no backend changes. `LogReportView` is extracted so the real dashboard and the new `/demo` route render the exact same report UI code (literal structural reuse per FR-002), rather than two components that happen to look similar. `index.tsx` is touched only in its unauthenticated branch — the authenticated behavior for signed-in users is unchanged.

**Known scope boundary vs. feature 002**: 002-log-dashboard-reporting's planned left-hand navigation shell (`AdminDashboard.tsx`, `DemoSection.tsx`) was never implemented — its Phase 3 tasks are still unchecked, and no such component exists in `client/src/`. FR-002's "reuse the same structural layout as the authenticated dashboard" is satisfied here against what actually exists today (the `LogReport` component tree), not against 002's still-aspirational nav shell. If 002's left-nav ships later, `/demo` should adopt it too — that's follow-up work, out of scope for this plan.

## Complexity Tracking

*No constitutional violations — table intentionally left empty.*
