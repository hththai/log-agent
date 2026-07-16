# Tasks: Log Dashboard Reporting

**Input**: Design documents from `/specs/002-log-dashboard-reporting/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create `client/src/auth/AuthProvider.tsx` to manage lightweight SSO-style session state and persist user identity
- [x] T002 Create `client/src/routes/login.tsx` for email-based sign-in and redirect to `/dashboard`
- [x] T003 Create `client/src/components/Theme/ThemeProvider.tsx` and hook it into `client/src/routes/__root.tsx` for dark mode support
- [x] T004 Update `client/src/styles.css` with Tailwind utility classes and dark-mode base styles
- [x] T005 Create `client/src/api/log.tsx` to wrap the existing `/logs` endpoint and support service, time range, and report-type query parameters

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T006 [P] Implement auth guard logic in `client/src/routes/dashboard.tsx` so only signed-in users can access the protected dashboard
- [ ] T007 [P] Implement the public landing/demo route in `client/src/routes/index.tsx` that shows demo content to unauthenticated visitors
- [ ] T008 [P] Implement `client/src/components/Demo/DemoSection.tsx` with key reporting capability summaries and a login CTA
- [ ] T009 [P] Update `client/src/auth/AuthProvider.tsx` to expose `loginWithSso`, `logout`, `isAuthenticated`, and `user` fields
- [ ] T010 [P] Verify the existing `server/app/routers/logs.py` contract matches the dashboard filters and document any backend expectations in `specs/002-log-dashboard-reporting/contracts/dashboard-api.md`

**Checkpoint**: Authentication, theme support, public demo, and API contract are ready for story work

---

## Phase 3: User Story 1 - Explore protected dashboard reports (Priority: P1)

**Goal**: Allow a signed-in user to open the dashboard, view service-level report summaries, and apply core filters without leaving the main experience.

**Independent Test**: A signed-in user can open `/dashboard`, see summary cards, and update at least one filter.

- [ ] T011 [US1] Create `client/src/components/Admin/AdminDashboard.tsx` with a left-hand navigation layout and dashboard shell
- [ ] T012 [US1] Add dashboard filters for service, report type, and time range in `client/src/components/Admin/AdminDashboard.tsx`
- [ ] T013 [US1] Fetch report data using `client/src/api/log.tsx` and render summary cards and a chart in `client/src/components/Admin/AdminDashboard.tsx`
- [ ] T014 [US1] Add a simple auth-guard integration in `client/src/routes/dashboard.tsx` so unauthenticated users are redirected to `/login`
- [ ] T015 [US1] Add a focused unit test in `client/src/auth/AuthProvider.test.tsx` validating an authenticated session is persisted and restored

**Checkpoint**: Protected dashboard view is implemented and can be tested with a signed-in session

---

## Phase 4: User Story 2 - Review IP and service-based insights (Priority: P2)

**Goal**: Enable the dashboard to show IP-centric and service-centric reports and support cross-report filtering within the protected experience.

**Independent Test**: A signed-in user can switch to IP and service report views and see the dashboard update accordingly.

- [ ] T016 [US2] Add IP reporting cards and service breakdowns to `client/src/components/Admin/AdminDashboard.tsx`
- [ ] T017 [US2] Implement cross-report filter behavior in `client/src/components/Admin/AdminDashboard.tsx` so service selection affects the loaded reports
- [ ] T018 [US2] Add a unit test in `client/src/components/Admin/AdminDashboard.test.tsx` covering filter state and visible report changes
- [ ] T019 [US2] Add a responsive service/IP report layout variant for mobile and desktop in `client/src/components/Admin/AdminDashboard.tsx`

**Checkpoint**: The dashboard supports both IP and service reporting views and cross-report filtering

---

## Phase 5: User Story 3 - Experience the demo experience before login (Priority: P3)

**Goal**: Provide a public demo section for visitors who are not signed in, while preserving the protected dashboard for authenticated users.

**Independent Test**: A visitor can view the demo section before signing in and the login CTA appears.

- [ ] T020 [US3] Create `client/src/components/Demo/DemoSection.tsx` with descriptive cards for the reporting product
- [ ] T021 [US3] Update `client/src/routes/index.tsx` to show `DemoSection` to unauthenticated visitors and preserve access to the dashboard when authenticated
- [ ] T022 [US3] Add a CTA button in the demo section that navigates to `/login`
- [ ] T023 [US3] Add a unit test in `client/src/routes/index.test.tsx` verifying the demo section displays only for unauthenticated users

**Checkpoint**: Public demo content is available and separate from the protected dashboard

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T024 [P] Update `client/src/styles.css` and Tailwind classes to refine spacing, dark mode, and mobile responsiveness
- [ ] T025 [P] Add a theme toggle in `client/src/components/Theme/ThemeProvider.tsx` and persist the preference to local storage
- [ ] T026 [P] Review and simplify the dashboard code in `client/src/components/Admin/AdminDashboard.tsx` to preserve clean code
- [ ] T027 [P] Add documentation notes to `specs/002-log-dashboard-reporting/quickstart.md` for how to run and validate the dashboard
- [ ] T028 [P] Verify the feature with focused manual checks at desktop and phone widths

## Dependencies & Execution Order

- Setup tasks (Phase 1) can begin immediately and establish the dashboard and auth foundations.
- Foundational tasks (Phase 2) must complete before implementing protected story work.
- User Story phases (Phase 3, Phase 4, Phase 5) depend on the foundational phase but can proceed in priority order or in parallel once the foundation is complete.
- Polish tasks can run after the dashboard implementation is functional.

## Parallel Opportunities

- `T006`, `T007`, `T008`, `T009`, and `T010` can run in parallel because they are independent foundation tasks.
- `T016` and `T017` are parallelizable within US2 because they update separate UI and test files.
- `T024` through `T028` can run in parallel for UI refinement and documentation updates.
