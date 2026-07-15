# Implementation Plan: Log Dashboard Reporting

**Branch**: `002-log-dashboard-reporting` | **Date**: 2026-07-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-log-dashboard-reporting/spec.md`

## Summary

Build a secure, responsive log dashboard in the existing TanStack client with a left navigation panel, a public demo section, and a protected reporting experience that uses the current Python API. The dashboard will support report filtering across services and IP-related views, with a simple dark-mode option implemented through Tailwind and a lightweight theme context.

## Technical Context

**Language/Version**: TypeScript 6 / React 19 / Python 3.11

**Primary Dependencies**: TanStack Start, React Query, Recharts, FastAPI, asyncpg, Tailwind CSS v4

**Storage**: Existing PostgreSQL-backed log tables exposed through the FastAPI `/logs` endpoint

**Testing**: Vitest for client-side behavior; simple unit tests for auth guard, theme toggle, and filter state changes; optional API smoke check

**Target Platform**: Web browser on desktop and mobile

**Project Type**: Web application

**Performance Goals**: Render the dashboard quickly for typical log payloads and keep filtering interactive without requiring new backend routes

**Constraints**: Keep the implementation simple, avoid new framework dependencies, and preserve the existing Docker and API workflow

**Scale/Scope**: One protected admin dashboard experience plus one public demo experience for unauthenticated visitors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Clean code: feature changes MUST remain readable, typed, and small enough to review.
- Simple UX: user-facing work MUST keep flows obvious and avoid unnecessary steps.
- Simple unit tests: new or changed logic MUST include focused tests where practical.
- Minimal dependencies: new packages MUST be justified and avoid unnecessary stack expansion.

## Project Structure

### Documentation (this feature)

```text
specs/002-log-dashboard-reporting/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── api/
│   ├── auth/
│   ├── components/
│   │   ├── Admin/
│   │   └── Theme/
│   ├── routes/
│   └── styles.css
└── tests/

server/
├── app/
│   ├── routers/
│   └── repositories/
└── main.py
```

**Structure Decision**: Implement the feature in the existing TanStack client under [client/src](client/src) and reuse the current FastAPI log endpoint under [server/app/routers/logs.py](server/app/routers/logs.py). No new backend service is required for v1.

## Complexity Tracking

No constitutional violations are expected for this feature.
