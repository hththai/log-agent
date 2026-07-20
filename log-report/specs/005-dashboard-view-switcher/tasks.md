---

description: "Task list for Dashboard View Switcher"
---

# Tasks: Dashboard View Switcher

**Input**: Design documents from `/specs/005-dashboard-view-switcher/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dashboard-view-switcher.md, quickstart.md

**Tests**: Included at a focused level per the plan's Testing section (Vitest + `@testing-library/react`) and the spec's Constitution Alignment requirement for a brief unit test strategy — not full TDD coverage.

**Organization**: Tasks are grouped by user story (US1, US2, US3 from spec.md) to enable independent implementation and testing of each story. US1 and US3 are both Priority P1; US1 is sequenced first since US3 (phone-breakpoint hiding) extends the switcher US1 delivers.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to the repository root (`client/`)

## Existing state (read before starting)

- `client/src/components/Log/LogReportView.tsx`: currently renders `LogInfoBar`, `LogTable`, `LogPie`, and `LogNetworkGraph` all stacked in one column (see current file); owns the existing `selectedService` filter state. This feature adds an `activeView` state and a new switcher control, and splits the existing JSX into two conditionally-rendered groups — it does not change the filter logic itself.
- `client/src/components/Log/LogReportView.test.tsx`: existing tests mock `LogPie` and stub `cytoscape` (`LogNetworkGraph`'s dependency); new tests in this feature follow the same mocking pattern.
- Both the authenticated dashboard (`LogReport` → `LogReportView`) and the public `/demo` route (`client/src/routes/demo.tsx`) already render `LogReportView` — no changes to either of those files are needed for this feature (research.md §2).
- `client/package.json`: `lucide-react` is already a dependency and already used for icons elsewhere (`LogInfoBar.tsx`, `ThemeToggle.tsx`) — no new dependency needed.
- `client/src/components/Theme/ThemeProvider.tsx` already uses `window.matchMedia(...)` with a `change` listener — this feature's phone-breakpoint detection follows the same established pattern (research.md §3).

## Constitution Alignment

- Tasks MUST preserve clean code, simple UX, focused simple unit tests, and minimal dependencies.
- UI tasks MUST include verification at common breakpoints.
- Dependency changes MUST be treated as a separate task with justification and validation (not applicable here — no new dependency, see T001).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Stand up the new component file every user story builds on.

- [X] T001 Scaffold `client/src/components/Log/DashboardViewSwitcher.tsx`: component shell with the prop interface from contracts/dashboard-view-switcher.md (`activeView: 'table' | 'diagram'`, `onChange: (view) => void`, `showDiagramOption: boolean`), rendering two `<button type="button">` elements inside a `<div role="group" aria-label="Dashboard view">` (no click wiring or icons yet) (justification: activates existing `lucide-react`, no `pnpm add` needed, per research.md §1)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Split `LogReportView` into two conditionally-rendered groups so every user story has something to toggle.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 In `client/src/components/Log/LogReportView.tsx`, add `activeView` state (`useState<'table' | 'diagram'>('table')`), render `<DashboardViewSwitcher activeView={activeView} onChange={setActiveView} showDiagramOption={true} />` above the existing content, and split the existing JSX into two conditionally-rendered groups gated on `activeView`: "Table & Chart" (`LogInfoBar` + `LogTable` + `LogPie`) and "Network Diagram" (`LogNetworkGraph`) — exactly one renders at a time (depends on T001; data-model.md, research.md §2, FR-002, FR-003)

**Checkpoint**: Two view groups exist and can be toggled by directly setting state (click wiring not yet connected) — ready for story-specific interactive behavior.

---

## Phase 3: User Story 1 - Switch between table/chart and network diagram views (Priority: P1) 🎯 MVP

**Goal**: A dashboard viewer can switch between the "Table & Chart" view and the "Network Diagram" view with a single click, with "Table & Chart" shown by default.

**Independent Test**: Load the dashboard, confirm "Table & Chart" is shown by default, click "Network Diagram" in the switcher, confirm the diagram appears and the table/chart group disappears, then switch back and confirm the table/chart group returns.

### Implementation for User Story 1

- [X] T003 [US1] In `client/src/components/Log/DashboardViewSwitcher.tsx`, finish the interactive markup: an icon (`lucide-react`) + text label per option, `aria-pressed={activeView === <that option>}`, `onClick={() => onChange(<that option>)}`, and active/inactive styling (`bg-cyan-600 text-white` active; `text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800` inactive) per research.md §1 and contracts/dashboard-view-switcher.md (depends on T002)
- [X] T004 [P] [US1] Unit test in `client/src/components/Log/DashboardViewSwitcher.test.tsx`: renders both options when `showDiagramOption` is `true`, clicking each option calls `onChange` with the corresponding value, and `aria-pressed` matches the `activeView` prop for each option (contracts/dashboard-view-switcher.md) (depends on T003)
- [X] T005 [US1] Unit test in `client/src/components/Log/LogReportView.test.tsx`: default render shows "Table & Chart" content (e.g., the info bar text) and does not render the network diagram; clicking the switcher's "Network Diagram" option shows the diagram and hides the table/chart group; clicking "Table & Chart" again restores it (depends on T003)

**Checkpoint**: A dashboard viewer can toggle between both views in one click, with "Table & Chart" as the default — User Story 1 is fully functional and independently testable (MVP).

---

## Phase 4: User Story 3 - Network diagram option is unavailable on phone-sized screens (Priority: P1)

**Goal**: On phone-sized viewports, the "Network Diagram" option is not shown/selectable, and if it was active when the viewport shrinks, the dashboard falls back to "Table & Chart" automatically.

**Independent Test**: Load the dashboard at a phone-sized viewport and confirm only "Table & Chart" appears in the switcher; then, starting from a desktop-sized window with "Network Diagram" active, resize down to phone width and confirm the dashboard falls back to "Table & Chart" and the option disappears.

### Implementation for User Story 3

- [ ] T006 [US3] In `client/src/components/Log/LogReportView.tsx`, add phone-breakpoint detection: a `useEffect` registering a `window.matchMedia('(min-width: 640px)')` listener (mirroring `ThemeProvider.tsx`'s existing `matchMedia` pattern) that drives a `showDiagramOption` boolean, passed into `DashboardViewSwitcher` instead of the hardcoded `true` from T002 (research.md §3, FR-006)
- [ ] T007 [US3] In the same `matchMedia` listener from T006, add the auto-fallback: if `activeView === 'diagram'` and the media query no longer matches, reset `activeView` to `'table'` (research.md §3, FR-007) (depends on T006)
- [ ] T008 [P] [US3] Unit tests in `client/src/components/Log/LogReportView.test.tsx` mocking `window.matchMedia`: (1) simulating a phone-width match asserts the "Network Diagram" option is absent from the rendered switcher; (2) simulating an active "Network Diagram" view followed by a `matchMedia` `change` event into phone width asserts `activeView` falls back to `'table'` and the table/chart group re-renders (depends on T007)

**Checkpoint**: The "Network Diagram" option is never shown or reachable on phone-sized screens, and an active diagram view auto-recovers on resize — User Story 3 is independently testable.

---

## Phase 5: User Story 2 - Filters and data stay consistent across views (Priority: P2)

**Goal**: A previously-applied service filter remains applied after switching views and back; switching views never triggers a new data fetch.

**Independent Test**: On the "Table & Chart" view, select a service filter, switch to "Network Diagram" and back to "Table & Chart", and confirm the same filter is still applied.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Unit test in `client/src/components/Log/LogReportView.test.tsx`: select a service filter via `LogPie`'s `onSliceClick` (same mocking pattern already used in this file), switch `activeView` to "Network Diagram" and back to "Table & Chart", and assert the info-bar total/filtered rows still reflect the selected filter (research.md §4, FR-004, FR-005) — no new implementation code is expected here, since `selectedService` state placement (unchanged from before this feature) already guarantees this; this task exists to lock the behavior in with a regression test (depends on T005)

**Checkpoint**: All three user stories are independently functional — a signed-in or demo viewer can discover, use, and rely on the view switcher correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Breakpoint verification, end-to-end validation, and a final consistency pass.

- [ ] T010 [P] Verify the switcher at mobile/tablet/desktop breakpoints in a browser (devtools device toolbar), confirming the "Network Diagram" option appears/disappears at the 640px boundary and the active-state indicator is clear in both light and dark mode (constitution: UI tasks MUST include breakpoint verification)
- [ ] T011 [P] Run quickstart.md validation end to end (all 7 scenarios) on both `/` (authenticated) and `/demo`, and record results
- [ ] T012 Review `client/src/components/Log/DashboardViewSwitcher.tsx` and `client/src/components/Log/LogReportView.tsx` for consistent styling with the rest of the app, and confirm the existing `selectedService` filter logic and commented-out `LogIpReport` usage are otherwise untouched

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories.
- **User Stories (Phase 3-5)**: All depend on Foundational (T002) completion.
  - US1 must land first — US3 extends the same switcher/state US1 introduces, and US2's test depends on US1's toggle test existing as a base.
  - US3 (P1) is sequenced directly after US1 since it shares the same priority and the same files.
  - US2 (P2) can be validated any time after US1, independent of US3.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories.
- **User Story 3 (P1)**: Depends on US1's switcher/state existing in `LogReportView.tsx` (T003) — adds phone-breakpoint logic to the same file.
- **User Story 2 (P2)**: Depends on US1's toggle test (T005) as the base to extend with a filter-selection step; independent of US3's phone-breakpoint work.

### Within Each User Story

- Foundational component/state split before story-specific interactive behavior; behavior before its tests.
- Story complete and checkpointed before moving to the next priority.

### Parallel Opportunities

- Setup: T001 has no dependencies within its phase.
- Foundational: T002 is a single task (depends on T001).
- US1: T004 and T005 both depend on T003 but touch different files (`DashboardViewSwitcher.test.tsx` vs `LogReportView.test.tsx`) and can run in parallel.
- US3: T006 and T007 edit the same file sequentially; T008 depends on T007.
- US2: T009 has no same-phase file conflicts and can run in parallel with US3's tasks if staffed separately.
- Polish: T010 and T011 run in parallel; T012 runs last as a final pass.

---

## Parallel Example: User Story 1

```bash
# T004 and T005 both depend on T003 but touch different files and can start together:
Task: "Unit test the switcher's click/aria-pressed behavior in DashboardViewSwitcher.test.tsx"
Task: "Unit test LogReportView's default view and toggle behavior in LogReportView.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: a dashboard viewer can switch between "Table & Chart" and "Network Diagram" in one click, with "Table & Chart" as the default
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → demo (MVP)
3. Add User Story 3 → validate independently (phone-sized hiding + auto-fallback) → demo
4. Add User Story 2 → validate independently (filter persists across a switch) → demo
5. Polish → breakpoints, quickstart run-through, consistency review

---

## Notes

- [P] tasks = different files, no dependencies on each other.
- [Story] label maps task to specific user story for traceability.
- No new runtime dependency is introduced — `lucide-react` was already present and used elsewhere (T001).
- No backend changes — this entire feature lives under `client/src/`.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
