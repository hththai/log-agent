# Contract: Dashboard View Switcher Component

This feature has no backend/API surface — the only interfaces worth pinning down are the internal component contracts between the new switcher, `LogReportView`, and the existing view components it now groups.

## `<DashboardViewSwitcher />`

**Location**: `client/src/components/Log/DashboardViewSwitcher.tsx`

**Props**:

| Prop | Type | Notes |
|---|---|---|
| `activeView` | `'table' \| 'diagram'` | Currently active view, owned by the parent (`LogReportView`) |
| `onChange` | `(view: 'table' \| 'diagram') => void` | Called when the user selects an option |
| `showDiagramOption` | `boolean` | Whether the "Network Diagram" option renders at all — `false` on phone-sized viewports (FR-006) |

### Guarantees

- Renders exactly two labeled, icon+text options when `showDiagramOption` is `true`; exactly one (the "Table & Chart" option only) when `showDiagramOption` is `false`.
- The option matching `activeView` is visually distinguishable from the other (FR-008) via a non-color-only cue (filled background, not color alone) — see research.md §1.
- Every rendered option is a native `<button type="button" aria-pressed={...}>`, keyboard-focusable in visual (DOM) order, inside a `<div role="group" aria-label="Dashboard view">`.
- Calling `onChange` is the component's only side effect — it never mutates data, triggers a fetch, or reads `window` itself (viewport detection lives in the parent, per data-model.md).

### Consumers

- `client/src/components/Log/LogReportView.tsx` — the only caller. Owns `activeView` state, computes `showDiagramOption` from a `matchMedia('(min-width: 640px)')` listener, and conditionally renders the `Table & Chart` group (`LogInfoBar` + `LogTable` + `LogPie`) or the `Network Diagram` group (`LogNetworkGraph`) based on `activeView`.

## `LogReportView` (updated contract)

**Location**: `client/src/components/Log/LogReportView.tsx`

**Props**: unchanged — still `{ data: LogsResponse }`.

### Added guarantees (on top of existing filtering behavior)

- On mount, renders the "Table & Chart" group by default (FR-002).
- Exactly one of the two view groups is rendered at a time (FR-003) — never both, never neither (while `data` is present).
- `selectedService` (existing filter state) is unaffected by `activeView` changes in either direction (FR-004, FR-005).
- If `activeView === 'diagram'` and the viewport narrows to phone-size, `activeView` resets to `'table'` on the next `matchMedia` change event (FR-007).
