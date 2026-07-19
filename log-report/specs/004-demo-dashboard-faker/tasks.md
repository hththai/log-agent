---

description: "Task list for Demo Dashboard with Faker Data"
---

# Tasks: Demo Dashboard with Faker Data

**Input**: Design documents from `/specs/004-demo-dashboard-faker/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/demo-data-generator.md, quickstart.md

**Tests**: Included at a focused level per the plan's Testing section (Vitest + `@testing-library/react`) and the spec's Constitution Alignment requirement for a brief unit test strategy — not full TDD coverage.

**Organization**: Tasks are grouped by user story (US1, US2, US3 from spec.md) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to the repository root (`client/`)

## Existing state (read before starting)

- `client/src/api/log.tsx`: defines `LogItem`, `LogsResponse`, `ServiceCount`, and `getLogs()` — the real API client. This feature reuses these exact types for the generated data; it does not modify this file.
- `client/src/components/Log/LogReport.tsx`: currently fetches real data via `useQuery({ queryFn: getLogs })` and renders `LogInfoBar`, `LogTable`, `LogPie`, `LogIpReport`, `LogNetworkGraph` inline. This feature splits it into a data-fetching wrapper (`LogReport`) and a new presentational component (`LogReportView`) — see research.md §2.
- `client/src/routes/index.tsx`: currently redirects every unauthenticated visitor to `/login` and renders nothing public (`return null`). This feature's landing-page fix touches only the unauthenticated branch — see research.md §3. The authenticated branch (renders `<LogReport />`) is unchanged.
- `client/package.json`: `@faker-js/faker` (`^10.3.0`) is already listed as a dependency and is currently unused anywhere in `client/src` — no install step is needed.
- 002-log-dashboard-reporting's planned `AdminDashboard.tsx`/left-nav shell does not exist in the codebase (its tasks are unchecked) — this feature does not depend on it and does not build it.

## Constitution Alignment

- Tasks MUST preserve clean code, simple UX, focused simple unit tests, and minimal dependencies.
- UI tasks MUST include verification at common breakpoints.
- Dependency changes MUST be treated as a separate task with justification and validation (see T001 — no new dependency, just activating an existing one).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stand up the one new module all stories build on.

- [X] T001 [P] Create `client/src/api/demoLog.ts` and confirm `@faker-js/faker` (already in `client/package.json`, currently unused) imports and resolves correctly (justification: activates an already-installed dependency — no `pnpm add` needed, per research.md §1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared rendering component and data generator every user story needs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Extract the presentational body of `client/src/components/Log/LogReport.tsx` into a new `client/src/components/Log/LogReportView.tsx` accepting a `data: LogsResponse` prop; preserve the existing `selectedService` filter state and the `LogInfoBar`/`LogTable`/`LogPie`/`LogIpReport`/`LogNetworkGraph` composition unchanged (research.md §2)
- [X] T003 Update `client/src/components/Log/LogReport.tsx` to a thin wrapper: keep `useQuery({ queryKey: ['logData'], queryFn: getLogs })`, and on success render `<LogReportView data={data} />` instead of the inline JSX it used to own (depends on T002)
- [X] T004 Implement `generateDemoLogsResponse(): LogsResponse` in `client/src/api/demoLog.ts` using `@faker-js/faker`: 100-300 `LogItem` rows spread across `ocr_api`/`ocr_client`/`doc_invoice` (every service represented), every field populated (no nulls), `table: "demo"`, `page: 1`, `page_size: items.length` — per contracts/demo-data-generator.md and data-model.md (depends on T001)
- [X] T005 [P] Unit test for `generateDemoLogsResponse` in `client/src/api/demoLog.test.ts`: asserts `items.length` is within 100-300, all three sample services are represented, and every `LogItem` field is populated (contracts/demo-data-generator.md) (depends on T004)

**Checkpoint**: `LogReportView` and the demo data generator are ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Explore a realistic demo dashboard without signing in (Priority: P1) 🎯 MVP

**Goal**: A signed-out visitor can reach a populated, interactive dashboard in one click, with zero calls to the real `/logs` API.

**Independent Test**: Visit `/` while signed out, click the demo entry point, land on `/demo` and see a dashboard populated with sample data; confirm via devtools/network mock that no request to `/logs` occurs.

### Implementation for User Story 1

- [X] T006 [US1] Create `client/src/routes/demo.tsx` as a public route (`createFileRoute('/demo')`, no auth guard): generate the dataset once via a lazy `useState(() => generateDemoLogsResponse())` initializer (FR-009, research.md §5) and render `<LogReportView data={dataset} />` inside the same page-shell Tailwind pattern used by `login.tsx`/`index.tsx` (depends on T002, T004)
- [X] T007 [P] [US1] Update the unauthenticated branch of `client/src/routes/index.tsx`: replace the empty `return null` redirect-to-`/login` behavior with a public landing view containing a "View demo dashboard" link to `/demo` and a "Sign in" link to `/login`; leave the authenticated branch (`<LogReport />`) unchanged (research.md §3)
- [X] T008 [US1] Unit test for the `/demo` route in `client/src/routes/demo.test.tsx`: renders successfully, shows dashboard content (e.g., the info bar from `LogReportView`), and — mocking `getLogs` from `#/api/log` — asserts it is never called (depends on T006)
- [X] T009 [P] [US1] Unit test for the landing view in `client/src/routes/index.test.tsx`: an unauthenticated render shows the "View demo dashboard" link instead of redirecting; an authenticated render is unchanged from today's behavior (depends on T007)

**Checkpoint**: A signed-out visitor can reach `/demo` in one click and see a populated, real-API-free dashboard — User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Apply filters and explore sample report data (Priority: P2)

**Goal**: Filtering on `/demo` (service pie-chart slice, table filters) narrows the visible sample data exactly as it does for real data, since `LogReportView`'s existing filter logic is reused verbatim (research.md §4).

**Independent Test**: On `/demo`, select a service filter and confirm the info cards/table/other views narrow to that service's sample rows only.

### Implementation for User Story 2

- [X] T010 [P] [US2] Component test in `client/src/components/Log/LogReportView.test.tsx`: given a `DemoDataset`-shaped `LogsResponse` fixture, selecting a service (via the pie chart's `onSliceClick` callback) filters the rendered table rows and info-bar counts to that service only (depends on T002)
- [X] T011 [US2] Extend `client/src/routes/demo.test.tsx` with a scenario asserting the `/demo` route's dataset stays stable while filtering — selecting then clearing a filter does not change the underlying total row count (validates FR-009 end-to-end, not just at the generator level) (depends on T008)

**Checkpoint**: Filtering on `/demo` is proven to behave identically to the real dashboard's filtering — User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Understand this is sample data and be prompted to sign in (Priority: P3)

**Goal**: Visitors can immediately tell `/demo` shows sample data, have a clear path to sign in, and see a graceful message instead of a broken page if data generation fails.

**Independent Test**: Open `/demo` and confirm a sample-data indicator and a sign-in call-to-action are both visible; simulate a data-generation failure and confirm the fallback message appears instead of the dashboard.

### Implementation for User Story 3

- [X] T012 [US3] Add a persistent sample-data banner to `client/src/routes/demo.tsx` (e.g., "You're viewing sample data — not live production data"), rendered above `LogReportView` so it's visible immediately on first render (FR-006, SC-004) (depends on T006)
- [X] T013 [US3] Add a "Sign in" call-to-action link to `/login` in `client/src/routes/demo.tsx`, visible alongside the sample-data banner (FR-007) (depends on T012 — same file)
- [X] T014 [US3] Wrap the `generateDemoLogsResponse()` call in `client/src/routes/demo.tsx` in a try/catch; on error, render "Demo preview unavailable — please retry" in place of the banner and `LogReportView`, with no fallback/hard-coded dataset (FR-010) (depends on T013 — same file)
- [X] T015 [US3] Unit test in `client/src/routes/demo.test.tsx`: mocking `generateDemoLogsResponse` to throw, asserts the error message renders instead of the dashboard chrome (depends on T014)
- [X] T016 [US3] Unit test in `client/src/routes/demo.test.tsx`: asserts the sample-data banner and sign-in link are present in the default (non-error) render (depends on T012, T013, T015)

**Checkpoint**: All three user stories are independently functional — visitors can discover, use, and correctly interpret the demo dashboard.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Breakpoint verification, end-to-end validation, and a final consistency pass.

- [X] T017 [P] Verify `/demo` and the updated `/` landing view at mobile/tablet/desktop breakpoints (constitution: UI tasks MUST include breakpoint verification)
- [X] T018 [P] Run `quickstart.md` validation end to end (all 7 scenarios) and record results
- [X] T019 Review `client/src/routes/demo.tsx`, `client/src/api/demoLog.ts`, and `client/src/components/Log/LogReportView.tsx` for consistent styling with the rest of the app, and confirm no reference to the real `/logs` API or `getLogs` exists anywhere on the `/demo` path

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories.
- **User Stories (Phase 3-5)**: All depend on Foundational (T002-T005) completion.
  - US1 must land first for a coherent MVP (`/demo` has to exist before US2's filtering or US3's banner/CTA can be added to it).
  - US2 and US3 both build directly on `client/src/routes/demo.tsx` from US1 — implement in priority order, not in parallel with each other.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories.
- **User Story 2 (P2)**: Depends on US1's `demo.tsx` existing (T006) to have something to filter and test against.
- **User Story 3 (P3)**: Depends on US1's `demo.tsx` existing (T006); adds banner/CTA/error-handling to the same file, independent of US2's filter-behavior tests.

### Within Each User Story

- Foundational component/generator before route implementation; route implementation before its tests.
- Story complete and checkpointed before moving to the next priority.

### Parallel Opportunities

- Setup: T001 has no dependencies within its phase.
- Foundational: T002 and T004 run in parallel (different files, no dependency on each other); T003 depends on T002; T005 depends on T004.
- US1: T006 and T007 run in parallel (different files: `demo.tsx` vs. `index.tsx`); T008 depends on T006; T009 depends on T007 and can run parallel to T008.
- US2: T010 has no same-phase file conflicts and can run in parallel with US1's tasks if staffed separately; T011 depends on T008.
- US3: T012-T014 all edit `demo.tsx` sequentially; T015-T016 both edit `demo.test.tsx` sequentially, after the implementation tasks land.
- Polish: T017 and T018 run in parallel; T019 runs last as a final pass.

---

## Parallel Example: Foundational

```bash
# T002 and T004 have no dependency on each other and can start together:
Task: "Extract LogReportView from LogReport.tsx"
Task: "Implement generateDemoLogsResponse() in demoLog.ts"
```

## Parallel Example: User Story 1

```bash
# T006 and T007 touch different files and can start together:
Task: "Create the public /demo route in client/src/routes/demo.tsx"
Task: "Fix index.tsx's unauthenticated branch to show a landing view with a Demo CTA"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: a signed-out visitor can reach `/demo` in one click and see a populated, real-API-free dashboard
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → demo (MVP)
3. Add User Story 2 → validate independently (filtering behaves correctly) → demo
4. Add User Story 3 → validate independently (banner, sign-in CTA, error state) → demo
5. Polish → breakpoints, quickstart run-through, consistency review

---

## Notes

- [P] tasks = different files, no dependencies on each other.
- [Story] label maps task to specific user story for traceability.
- No new runtime dependency is introduced — `@faker-js/faker` was already present and unused (T001).
- No backend changes — this entire feature lives under `client/src/`.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
