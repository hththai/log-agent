# Research: Dashboard View Switcher

## 1. Switcher UI pattern (`ui-ux-pro-max` guidance)

**Decision**: A two-button segmented control, not a full ARIA `tablist`/`tab` pattern. Each option is a plain `<button type="button" aria-pressed={isActive}>` inside a `<div role="group" aria-label="Dashboard view">`, with an icon (`lucide-react`) + text label per option (e.g., `Table2`/`LayoutGrid` for "Table & Chart", `Share2`/`Waypoints` for "Network Diagram" — final icon picked at implementation time from the already-installed `lucide-react` set). Active state uses a filled `bg-cyan-600 text-white` pill; inactive uses `text-slate-600 hover:bg-slate-100` (`dark:text-slate-300 dark:hover:bg-slate-800`) — the same cyan-600/slate palette already used for CTAs and active states elsewhere in the app (`index.tsx`, `demo.tsx`, `ThemeToggle.tsx`).

**Rationale**: `ui-ux-pro-max`'s `nav-state-active`, `nav-label-icon`, and `no-emoji-icons` rules call for an icon+label pair with a clear, non-color-only active indicator; `keyboard-nav` requires tab order to match visual order, which plain sequential `<button>`s already satisfy without needing roving-tabindex/arrow-key management. A full `role="tablist"` implementation would add keyboard-arrow-navigation logic for a 2-item control — more code for the same outcome, which conflicts with the constitution's "clean code" and "simple UX" principles for a 2-option switcher.

**Alternatives considered**:
- Full ARIA tabs pattern (`role="tablist"`, roving `tabIndex`, arrow-key navigation) — rejected as unnecessary complexity for exactly 2 options; the simpler toggle-group pattern is still keyboard- and screen-reader-accessible (`aria-pressed`, native button focus).
- Dropdown/select for the view choice — rejected; a persistent 2-option switcher is more discoverable and matches FR-008's "always visible active-state indicator" more directly than a closed dropdown.
- URL-based deep-linking for the active view (`?view=diagram`) — `ui-ux-pro-max`'s `deep-linking` rule flags this as good practice, but the spec doesn't require it and both dashboard surfaces (`LogReport`, `demo.tsx`) don't currently use search params for any state. Deferred as future follow-up, not blocking this feature.

## 2. Where the switcher and its state live

**Decision**: `LogReportView.tsx` gains one new `useState<'table' | 'diagram'>('table')` and renders a new `DashboardViewSwitcher` component, then conditionally renders either the `LogInfoBar`/`LogTable`/`LogPie` group or `LogNetworkGraph`, never both. `selectedService` (the existing filter state) stays exactly where it is today — unaffected by which view is active — since `LogTable`/`LogPie` (table view) and `LogNetworkGraph` (diagram view) already each accept the same `data`/filtered-items props independently.

**Rationale**: Both the authenticated dashboard (`LogReport` → `LogReportView`) and the public `/demo` route already funnel through `LogReportView`, so this is the single change point that satisfies FR-009 (available on every dashboard surface) without touching `LogReport.tsx`, `demo.tsx`, or `index.tsx` at all.

**Alternatives considered**:
- Adding the switcher separately inside `LogReport.tsx` and `demo.tsx` — rejected; duplicates logic in two places when one shared component already exists.

## 3. Phone-breakpoint detection (FR-006, FR-007)

**Decision**: Reuse the codebase's existing Tailwind default breakpoint convention (`sm` = 640px, already used for `sm:flex-row` etc. in `index.tsx`/`demo.tsx`) for two things:
1. **Visually hiding the option** (FR-006): the "Network Diagram" button is wrapped in `hidden sm:inline-flex` so it never renders below 640px — CSS alone guarantees it can't be clicked or focused when hidden.
2. **Driving the auto-fallback** (FR-007): a small `useEffect` with `window.matchMedia('(min-width: 640px)')` and a `change` listener (the same API `ThemeProvider.tsx` already uses for `prefers-color-scheme`) flips `activeView` back to `'table'` if it's `'diagram'` and the query no longer matches — i.e., on resize/rotation into phone width.

**Rationale**: CSS-only hiding satisfies "not shown" but not "state stays consistent if already on that view when the window shrinks" — the `matchMedia` listener is the minimal addition needed for FR-007, and it mirrors a pattern already proven in this codebase (`ThemeProvider.tsx`) rather than introducing a new one.

**Alternatives considered**:
- A `resize` event listener with manual `window.innerWidth` checks — rejected; `matchMedia` is the more efficient, purpose-built API and matches existing project precedent.
- A new `useMediaQuery` hook/dependency — rejected; the single inline `matchMedia` + `useEffect` needed here doesn't justify extracting a reusable hook or adding a package (constitution: minimal dependencies, no premature abstraction).

## 4. Filter persistence across views (FR-004, FR-005)

**Decision**: No new logic needed. `selectedService` already lives in `LogReportView` above both view groups; switching `activeView` only changes which JSX subtree renders — the filter state itself is untouched.

**Rationale**: This is a direct consequence of decision #2 (state stays in `LogReportView`, not per-view). Confirms FR-004/FR-005 are satisfied by the state placement alone, with no extra synchronization code required.

## 5. Testing strategy

**Decision**: A new `DashboardViewSwitcher.test.tsx` (or inline within `LogReportView.test.tsx`) covering: default view on mount, click-to-switch behavior, active-state indicator (`aria-pressed`), and the phone-breakpoint cases via mocking `window.matchMedia`. Extend the existing `LogReportView.test.tsx` (which already mocks `LogPie` and `cytoscape`) with a scenario asserting the selected-service filter survives a view switch.

**Rationale**: Matches the project's existing Vitest + `@testing-library/react` conventions (see `specs/004-demo-dashboard-faker/quickstart.md` and `LogReportView.test.tsx`); `window.matchMedia` mocking is a well-established jsdom testing pattern and needs no new test dependency.
