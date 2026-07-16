---

description: "Task list for Flexible Secure SSO Configuration"
---

# Tasks: Flexible Secure SSO Configuration

**Input**: Design documents from `/specs/003-sso-configuration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/sso-config-api.md, quickstart.md

**Tests**: Included at a focused level per the plan's Testing section ("Vitest for client-side behavior, plus focused backend or route-level validation") and the spec's Constitution Alignment requirement for a brief unit test strategy — not full TDD coverage.

**Organization**: Tasks are grouped by user story (US1, US2, US3 from spec.md) to enable independent implementation and testing of each story.

> **Revision note (post `/speckit-analyze`)**: Finding **G1** (CRITICAL) identified that no task protected the `/sso/*` write endpoints, violating FR-003's "restricted access to sensitive settings" and undermining SC-003. T010 (new) and its wiring into T014/T015/T019 fix this. Task IDs T010 onward were renumbered (+1) to make room; T021 (new) was also added to close the C2 gap (no test for the new `SsoConfigForm` component) for the story being implemented now.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to the repository root (`client/`, `server/`)

## Existing state (read before starting)

- `client/src/auth/AuthProvider.tsx` + `AuthProvider.test.tsx`: demo-only email sign-in from feature 001, persists to `localStorage`. This feature extends it to call the real backend and honor mapping/denial results — it does not replace the file.
- `client/src/routes/login.tsx`, `dashboard.tsx`, `index.tsx`: existing protected routes gated on `isAuthenticated` only. This feature adds role/allow gating.
- `server/app/`: FastAPI app with `config.py` (pydantic-settings), `routers/health.py`, `routers/logs.py`. No `services/` package and no test framework exist yet — both are introduced here.
- `client/src/components/Admin/`: directory exists but is empty — first SSO admin UI goes here.
- **Routing convention** (see `client/vite.config.ts` route rule `'/api/**': { proxy: internalApiUrl + '/**' }` and `client/src/api/log.tsx`): the browser always calls `/api/*`; in prod, Nitro strips `/api` and proxies to the bare FastAPI route; in dev, the client calls `http://localhost:8000/*` directly (no `/api` prefix — see `API_BASE` in `log.tsx`). **Backend routers must therefore be mounted without an `/api` prefix** (e.g. `APIRouter(prefix="/sso")`, not `/api/sso`), even though contracts/spec prose refers to the externally-visible `/api/sso/...` path.

## Constitution Alignment

- Tasks MUST preserve clean code, simple UX, focused unit tests, and minimal dependencies.
- UI tasks MUST include verification at common breakpoints.
- Dependency changes MUST be treated as a separate task with justification and validation (see T001).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Introduce the backend test framework and local SSO storage location — neither exists yet.

- [X] T001 Add `pytest`, `pytest-asyncio`, and `httpx` to `server/requirements.txt`, and add `server/pytest.ini` (`testpaths = tests`, `pythonpath = .`) (justification: no backend test framework currently exists in this project, and the plan requires "focused backend or route-level validation")
- [X] T002 Create `server/tests/conftest.py` with a `fastapi.testclient.TestClient` fixture wired to `app.main:app` (depends on T001)
- [X] T003 [P] Create `server/app/data/` for local SSO configuration storage and add `server/app/data/*.json` to the repo root `.gitignore` (no secrets or admin-entered config committed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain models, storage, routing/API-client scaffolding, and admin authorization that every user story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Define shared SSO domain models (`SSOProviderConfig`, `AccessMapping`, `UserIdentity`, `AccessPolicy`, `DemoModeConfig`, plus API-facing input/public variants) with Pydantic in `server/app/models/sso.py`, keeping `client_secret` out of any "public" response model (FR-003)
- [X] T005 [P] Define matching client-side SSO types (`SsoProviderConfigPublic`, `AccessMapping`, `AccessPolicy`, `DemoModeConfig`, `LoginResult`) in `client/src/auth/sso-types.ts`
- [X] T006 [P] Implement `SsoConfigStore` in `server/app/services/sso_store.py`: reads/writes provider config, mappings, and demo-mode settings to `server/app/data/sso_config.json`, never returns the raw secret to callers outside the store, and falls back to the `SSO_CLIENT_SECRET` env var when no secret is stored (depends on T004)
- [X] T007 [P] Create `server/app/routers/sso.py` with an `APIRouter(prefix="/sso", tags=["sso"])` (no `/api` prefix — see routing convention note above) and register it in `server/app/main.py` (depends on T004)
- [X] T008 [P] Create `client/src/api/sso.tsx` API client wrapper (`getConfig`, `saveConfig`, `getMappings`, `saveMapping`, `deleteMapping`, `validateConfig`, `login`) calling the `/api/sso/*` endpoints, following the `API_BASE` dev/prod pattern in `client/src/api/log.tsx` (depends on T005)
- [X] T009 [P] Add `sso_client_secret: str` and `sso_config_path: str` to the `Settings` class in `server/app/config.py`, and document `SSO_CLIENT_SECRET` in `server/.env.example` (depends on T004)
- [X] T010 **[G1 fix]** Implement `require_admin` in `server/app/security.py` using FastAPI's `fastapi.security.APIKeyHeader(name="X-Admin-Token")` (idiomatic — registers as an OpenAPI security scheme with an "Authorize" button in `/docs`, rather than a bare `Header()` dependency), comparing the supplied value (constant-time, via `secrets.compare_digest`) against `settings.admin_api_token`, raising 503 if no token is configured server-side and 401 on mismatch/missing header; add `admin_api_token: str = ""` to `Settings` in `server/app/config.py` and document `ADMIN_API_TOKEN` in `server/.env.example` (depends on T004, T009). **Rationale**: closes analysis finding G1 — FR-003 requires "restricted access to sensitive settings," but no prior task protected the SSO config/mapping write endpoints from anonymous callers.
- [X] T010b **[U2 partial fix]** Add `authlib>=1.3` to `server/requirements.txt` (justification: standard, actively maintained OIDC client library for Starlette/FastAPI — avoids hand-rolling token/discovery verification) and implement `build_oauth_client`/`fetch_server_metadata` in `server/app/services/oidc_client.py`, building a per-request Authlib `OAuth` remote app from a stored `SSOProviderConfig`. Used by `POST /sso/validate` (T015) for a live discovery-document check now; the full authorize-redirect/callback/token-exchange flow remains US2 scope (T026).

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 - Configure SSO access securely (Priority: P1) 🎯 MVP

**Goal**: An administrator can define an SSO provider (OIDC-style) and a demo-mode fallback, save it, and have the system accept it as ready for sign-in — and only an admin holding the configured token can write or validate that configuration.

**Independent Test**: Configure a provider via the admin UI/API using a valid admin token, save, then confirm `GET /api/sso/config` reflects it (redacted) and `POST /api/sso/validate` reports it ready; confirm the same write/validate calls are rejected with 401 when the token is missing or wrong.

### Tests for User Story 1

- [X] T011 [P] [US1] Unit test for `SsoConfigStore` persistence, required-field validation, and secret redaction in `server/tests/test_sso_store.py`
- [X] T012 [P] [US1] Contract test for `GET /sso/config`, `POST /sso/config`, and `POST /sso/validate` in `server/tests/test_sso_config_api.py`, **including cases asserting 401 on `POST`/`validate` with a missing/incorrect `X-Admin-Token` and success with the correct one** (covers G1)

### Implementation for User Story 1

- [X] T013 [US1] Implement `GET /sso/config` in `server/app/routers/sso.py` — **no auth required** (returns only the redacted, "safe to expose to the client" shape per contracts/sso-config-api.md) (depends on T006, T007)
- [X] T014 [US1] Implement `POST /sso/config` in `server/app/routers/sso.py`, **protected by `Depends(require_admin)`**, validating required fields (`provider_type`, `issuer`, `client_id`, `redirect_uri`) before persisting via `SsoConfigStore` (depends on T012, T013, T010)
- [X] T015 [US1] Implement `POST /sso/validate` in `server/app/routers/sso.py`, **protected by `Depends(require_admin)`**, checking configuration completeness/readiness (secret present, claim mapping present, provider enabled) **and performing a live OIDC discovery-document fetch via `fetch_server_metadata` (T010b/Authlib)**, returning a structured ready/not-ready result with reasons (depends on T014, T010, T010b)
- [X] T016 [US1] Add Demo Mode Configuration read/write (`enabled`, `default_email`, `allow_local_validation`) to `SsoConfigStore` and expose it through the same `GET`/`POST /sso/config` payload (FR-007) (depends on T006, T014)
- [X] T017 [US1] Build `SsoConfigForm` admin component in `client/src/components/Admin/SsoConfigForm.tsx` for entering provider fields and toggling demo mode, using `client/src/api/sso.tsx`; **include an "Admin token" password field, held in component state / `sessionStorage` only (never `localStorage`), sent as `X-Admin-Token` on save/validate calls** (depends on T008)
- [X] T018 [US1] Create protected admin route `client/src/routes/admin/sso-config.tsx` that renders `SsoConfigForm` behind the existing `isAuthenticated` check, following the pattern in `dashboard.tsx` (depends on T017)
- [X] T019 [US1] Add a "Validate configuration" action in `SsoConfigForm.tsx` that calls `POST /api/sso/validate` and surfaces the readiness result **or a clear "admin token required/incorrect" message on 401** to the admin (depends on T015, T017)
- [X] T020 [US1] Add inline validation/error handling to `SsoConfigForm.tsx` for missing required fields before submit, and verify the form at mobile/tablet/desktop breakpoints (depends on T017)
- [X] T021 [P] [US1] Component test for `SsoConfigForm.tsx` (required-field validation blocks submit; missing/invalid admin token surfaces an error) in `client/src/components/Admin/SsoConfigForm.test.tsx` (depends on T017, T019, T020)

**Checkpoint**: User Story 1 is fully functional and independently testable — an admin holding the configured token can configure and validate an SSO provider; anyone else is rejected.

---

## Phase 4: User Story 2 - Sign in and receive the right access (Priority: P1)

**Goal**: A user with a valid SSO identity signs in and reaches the correct protected experience per the configured mapping; an unmapped identity is denied with a clear message.

**Independent Test**: A valid identity signs in and lands on the dashboard with its mapped role; an identity with no matching mapping is blocked and shown a clear denial message.

### Tests for User Story 2

- [ ] T022 [P] [US2] Unit test for access-mapping evaluation (claim match → role/allow, no match → deny, missing attribute → deny) in `server/tests/test_sso_mapping_evaluation.py`
- [ ] T023 [P] [US2] Contract test for `POST /sso/login` covering allowed, denied, and missing-attribute identities in `server/tests/test_sso_login_api.py`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Implement `GET /sso/mappings` (no auth — needed for the sign-in evaluation path to be inspectable) and `POST /sso/mappings` (**protected by `Depends(require_admin)`**) in `server/app/routers/sso.py`, backed by `SsoConfigStore` (list/create/update `AccessMapping`) (depends on T006, T007, T010)
- [ ] T025 [P] [US2] Implement `evaluate_access(identity, mappings) -> AccessPolicy` in `server/app/services/access_evaluator.py`, denying by default when no mapping matches (FR-005, SC-003) (depends on T004)
- [ ] T026 [US2] Implement `POST /sso/login` in `server/app/routers/sso.py` (no admin auth — this is the end-user sign-in path): confirm the provider is configured and enabled, resolve a `UserIdentity` (SSO or demo-mode per FR-007), evaluate mappings via T025, and return the granted role or a denial reason (depends on T024, T025)
- [ ] T027 [US2] Handle the "missing required claim attribute" edge case in `evaluate_access` by denying with a specific reason code (depends on T025)
- [ ] T028 [US2] Extend `AuthProvider` in `client/src/auth/AuthProvider.tsx` to call `login()` from `client/src/api/sso.tsx`, store the granted role, and expose a denial message instead of always succeeding (depends on T008, T026)
- [ ] T029 [P] [US2] Update `client/src/routes/login.tsx` to submit through the new `AuthProvider` sign-in flow and display the server's denial message when access is blocked (depends on T028)
- [ ] T030 [P] [US2] Gate `client/src/routes/dashboard.tsx` and `client/src/routes/index.tsx` on the mapped role/allow result, not just `isAuthenticated` (depends on T028)
- [ ] T031 [P] [US2] Update `client/src/auth/AuthProvider.test.tsx` to cover the denied-identity path (signed-out state with an error message) (depends on T028)

**Checkpoint**: User Stories 1 and 2 both work independently — configuration and mapped sign-in are complete end to end.

---

## Phase 5: User Story 3 - Maintain secure governance over SSO controls (Priority: P2)

**Goal**: Admins can review, enable/disable providers, and manage mappings, with changes enforced on the next sign-in; disabled providers block sign-in with a clear message; activity is auditable.

**Independent Test**: Disable a provider (or edit/remove a mapping) and confirm the next sign-in attempt reflects the change immediately.

### Tests for User Story 3

- [ ] T032 [P] [US3] Contract test for disabled-provider login rejection and mapping edit/removal effects (including an unauthenticated `DELETE /sso/mappings/{id}` returning 401) in `server/tests/test_sso_governance_api.py`

### Implementation for User Story 3

- [ ] T033 [US3] Enforce the `enabled` flag on `SSOProviderConfig` in `POST /sso/login`, returning a clear "provider unavailable" denial when disabled (FR-004) (depends on T026)
- [ ] T034 [US3] Add mapping removal (`DELETE /sso/mappings/{id}`, **protected by `Depends(require_admin)`**) in `server/app/routers/sso.py`, wired to `deleteMapping` in `client/src/api/sso.tsx` (depends on T024, T010)
- [ ] T035 [US3] Add structured sign-in/access-control audit logging (timestamp, provider, subject/email, decision, reason — never the secret or the admin token) via Python's `logging` module in `server/app/routers/sso.py` (FR-008) (depends on T026)
- [ ] T036 [US3] Add an enable/disable toggle to `SsoConfigForm.tsx` and a mapping list/remove UI in `client/src/components/Admin/SsoMappingsPanel.tsx`, reusing the admin-token flow from T017, verified at mobile/tablet/desktop breakpoints (depends on T017, T034)
- [ ] T037 [US3] Surface the "provider unavailable" denial message from T033 in `client/src/routes/login.tsx` (depends on T029, T033)
- [ ] T038 [US3] Re-check provider/mapping state on the next authenticated request in `client/src/routes/index.tsx`, forcing logout if the provider was disabled or the user's mapping was removed mid-session (edge case: admin disables a provider while users are signed in) (depends on T030, T033)

**Checkpoint**: All three user stories are independently functional; governance changes take effect for subsequent sign-ins without breaking US1/US2.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, end-to-end validation, and a final security pass across all three stories.

- [ ] T039 [P] Document `SSO_CLIENT_SECRET`, `ADMIN_API_TOKEN`, and the SSO endpoints in `server/README.md`
- [ ] T040 [P] Review `server/app/routers/sso.py` and `server/app/services/*.py` for consistent error handling and response shapes across all endpoints, and confirm every write endpoint (`POST`/`DELETE`) carries `Depends(require_admin)`
- [ ] T041 Run `quickstart.md` validation end to end (configure provider, update mapping, disable provider, exercise demo mode) and record results
- [ ] T042 Security review: confirm `client_secret` and `admin_api_token` are never logged or returned in API responses, and `server/app/data/sso_config.json` is git-ignored (FR-003)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (T001–T003) — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: All depend on Foundational (T004–T010) completion — this now includes the `require_admin` dependency (T010), since every write endpoint in every story needs it.
  - US1 and US2 are both P1 and have no dependency on each other's implementation, but US2's sign-in flow is only meaningful once a provider exists — implement US1 first for a coherent MVP demo.
  - US3 depends on US1's config UI (T017) and US2's login endpoint (T026) for the enable/disable and mapping-removal enforcement points; it is additive governance on top of US1+US2, not a separate vertical slice.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational — no dependency on other stories.
- **User Story 2 (P1)**: Can start after Foundational; reuses `SsoConfigStore`/`AccessMapping` model from Foundational, not from US1's endpoints, so it is independently testable, but needs a saved config (from US1) to demo end to end.
- **User Story 3 (P2)**: Builds directly on US1's config endpoints/UI and US2's login endpoint (see task dependencies above) — implement after US1 and US2.

### Within Each User Story

- Tests written first (T011/T012, T022/T023, T032), then implementation.
- Models/store before endpoints; endpoints before client UI.
- Story complete and checkpointed before moving to the next priority.

### Parallel Opportunities

- Setup: T003 can run alongside T001/T002.
- Foundational: T004 and T005 run in parallel; then T006, T007, T008, T009 run in parallel (each touches a distinct file and depends only on T004/T005); T010 depends on T004+T009 so it runs after those two land.
- US1: T011 and T012 run in parallel (different test files); T021 runs after T017/T019/T020 land.
- US2: T022/T023 run in parallel; T024/T025 run in parallel; T029/T030/T031 run in parallel once T028 is done (different files, same single dependency).
- Different user stories can be staffed in parallel once Foundational is done, per the dependency notes above.

---

## Parallel Example: User Story 1

```bash
# Launch both User Story 1 tests together:
Task: "Unit test for SsoConfigStore in server/tests/test_sso_store.py"
Task: "Contract test (incl. 401 cases) for /sso/config and /sso/validate in server/tests/test_sso_config_api.py"
```

## Parallel Example: User Story 2

```bash
# After T028 (AuthProvider sign-in flow) lands, these three are independent:
Task: "Update client/src/routes/login.tsx to use the new sign-in flow"
Task: "Gate client/src/routes/dashboard.tsx and index.tsx on mapped role/allow"
Task: "Update client/src/auth/AuthProvider.test.tsx for the denied-identity path"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories, includes the G1 admin-auth fix)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: an admin holding the token can configure and validate an SSO provider end to end; anyone without it is rejected
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → validate independently → demo (MVP)
3. Add User Story 2 → validate independently (mapped sign-in + denial) → demo
4. Add User Story 3 → validate independently (governance/disable/audit) → demo
5. Polish → docs, quickstart run-through, security review

---

## Notes

- [P] tasks = different files, no dependencies on each other.
- [Story] label maps task to specific user story for traceability.
- Secrets (`client_secret`, `admin_api_token`) are sourced from env vars or a git-ignored local JSON file — never committed, never logged, never returned unredacted (FR-003).
- No new database table is introduced (per plan.md) — SSO config/mappings persist to a local JSON file via `SsoConfigStore`.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
- **Known deferred gaps from `/speckit-analyze`** (tracked for a future pass): U1 (no precedence rule when two mappings overlap), **U2 partially closed** — `POST /sso/validate` now does a live Authlib-backed OIDC discovery check (T010b/T015), but `POST /sso/login`'s full authorize-redirect/callback/token-exchange handshake is still unbuilt (US2/T026 scope), A1 (no measurable latency target), G2 (T032 should also cover a mapping *edit*, not just removal), I1 (contracts/sso-config-api.md doesn't yet document `DELETE /sso/mappings/{id}`).
