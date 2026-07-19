# Research: Demo Dashboard with Faker Data

## 1. Client-side fake data generation library

**Decision**: Use `@faker-js/faker` (already listed in `client/package.json` at `^10.3.0`, currently unused anywhere in `client/src`).

**Rationale**: Zero new dependency to install or justify — it's already in the dependency tree. It's the actively maintained, standard choice for exactly this (the user's own request named it), and produces plausible-looking IPs, timestamps, HTTP methods/paths/statuses with far less code than hand-rolled generators.

**Alternatives considered**:
- Hand-rolled random generators — more code to write and maintain for a worse result (obviously-fake-looking values undermine SC-002's "visitors immediately recognize the real product experience").
- A static fixture JSON file committed to the repo — simpler, but produces identical data on every visit forever, which reads as more "fake" than generated data and doesn't demonstrate any generation logic; rejected in favor of activating the dependency that's already there.

## 2. What "reuse the same structural layout" (FR-002) maps to in this codebase

**Decision**: Reuse the `LogReport` component tree — `LogInfoBar`, `LogTable`, `LogPie`, `LogIpReport`, `LogNetworkGraph` — which is the dashboard content actually rendered today on `/`. Extract its presentational body into a new `LogReportView` component so both the real and demo paths share the identical rendering code.

**Rationale**: 002-log-dashboard-reporting's spec/plan describe a left-hand-navigation `AdminDashboard.tsx` shell, but that work was never built — `client/src/components/Admin/` contains only `SsoConfigForm.tsx` (from feature 003), and 002/tasks.md's Phase 3 (T011-T015, which would create `AdminDashboard.tsx`) is entirely unchecked. Planning this feature against a component that doesn't exist would make it unbuildable. The concrete, already-shipped "dashboard structure" is `LogReport`.

**Alternatives considered**:
- Build 004 on top of a new `AdminDashboard.tsx` shell first — rejected as scope creep; that's 002's unfinished foundational work, not this feature's spec.
- Duplicate the report markup into a separate demo-only component — rejected; violates Clean Code (two copies of the same rendering logic to keep in sync) when a small extraction avoids it entirely.

## 3. Where the "Demo" entry point (FR-001) lives

**Decision**: `/` (`index.tsx`) currently redirects every unauthenticated visitor straight to `/login` and renders nothing (`return null`) — there is no public landing content today, despite 002-log-dashboard-reporting FR-006 having specified one. Minimally modify `index.tsx`'s unauthenticated branch to render a small public landing view with a "View demo dashboard" link (`/demo`) and a "Sign in" link (`/login`), instead of the empty redirect. The authenticated branch is untouched.

**Rationale**: FR-001 requires a visible entry point on "the public/unauthenticated landing experience" — there's nowhere else for it to live, and this is the smallest change that unblocks it.

**Alternatives considered**:
- Build out 002's full `DemoSection.tsx` card grid now — rejected, out of scope for this spec; only the minimal CTA needed to satisfy FR-001 is included here.
- A separate marketing route disconnected from `/` — rejected; `/` is the natural landing path and is already where 002 intended this content to live.

## 4. Satisfying filter interactions (FR-005) against generated data

**Decision**: No new filtering logic is needed. `LogReportView`'s existing in-memory filtering (`selectedService` state feeding `LogTable`'s built-in TanStack Table column filters, and `LogPie`'s slice-click callback) already operates purely over whatever `LogItem[]` array it receives — real or generated. Feeding it a faker-built array is sufficient.

**Rationale**: Avoids duplicating filter logic. Note this sidesteps the backend filter-contract gap flagged in the 002/003 analysis (client code assumes `service`/`report_type` query params the real `/logs` API doesn't implement) — irrelevant here since `/demo` never calls that API.

## 5. Dataset stability across a demo session (FR-009)

**Decision**: Generate the fake `LogsResponse` once via a lazy `useState(() => generateDemoLogsResponse())` initializer inside the `/demo` route component. This computes once per mount and stays referentially stable across re-renders and filter interactions; a fresh dataset is produced only when the component remounts (full page reload or re-navigating to `/demo`).

**Rationale**: Matches the clarified requirement exactly with no extra state management — `useState`'s lazy initializer is the standard React idiom for "compute once per mount."

## 6. Failure handling for data generation (FR-010)

**Decision**: Wrap the call to `generateDemoLogsResponse()` in a try/catch inside the route component. On a thrown error, render a minimal "Demo preview unavailable — please retry" message in place of the dashboard chrome; no fallback/hard-coded dataset.

**Rationale**: Gives the edge case a concrete, testable trigger — a unit test can mock the generator to throw and assert the error UI renders — without building a retry/loading state machine the spec didn't ask for.
