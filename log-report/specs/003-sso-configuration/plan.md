# Implementation Plan: Flexible Secure SSO Configuration

**Branch**: `003-sso-configuration` | **Date**: 2026-07-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/003-sso-configuration/spec.md`

## Summary

Implement a configurable, secure SSO foundation for the existing log dashboard experience. The first delivery will support a flexible OIDC-style provider configuration model, rule-based access mapping, and a lightweight demo-mode fallback for local validation without weakening the production access-control path.

**Post-clarification addition**: The production sign-in path (FR-009/FR-010/FR-011) is a real redirect-based OAuth flow — a "Sign in with `<Provider>`" link, a server-side callback that exchanges the code and verifies the ID token via Authlib, and a signed session cookie (Starlette `SessionMiddleware`) that becomes the source of truth for the SPA's auth state, replacing reliance on client-only `localStorage`. Demo-mode email entry remains, but only as the local-only fallback it always was — it is no longer the sole sign-in mechanism.

## Technical Context

**Language/Version**: TypeScript 6 / React 19 / Python 3.11

**Primary Dependencies**: TanStack Start, React Query, FastAPI, Python environment configuration, existing auth/session state in the client, Authlib (OIDC client, already added T010b), Starlette `SessionMiddleware` + `itsdangerous` (new — see research.md)

**Storage**: Existing application configuration (`sso_config.json` via `SsoConfigStore`) plus a server-signed session cookie for authenticated state; `localStorage` remains only as a client-side paint-avoidance hint, no longer the authoritative session; no new database is required for v1

**Testing**: Vitest for client-side behavior, plus focused backend or route-level validation for configuration parsing and access-control rules, including the callback/session endpoints (mocking Authlib's token exchange rather than hitting a real IdP in tests)

**Target Platform**: Web browser and existing local Docker-based development workflow

**Project Type**: Web application

**Performance Goals**: Keep sign-in and access evaluation fast for typical admin usage without adding noticeable latency

**Constraints**: Keep the implementation simple, avoid introducing unnecessary dependencies, and preserve existing Docker and API workflow

**Scale/Scope**: One secure SSO configuration flow, one access-mapping model, and one protected dashboard experience for administrators

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Clean code: feature changes MUST remain readable, typed, and small enough to review.
- Simple UX: user-facing work MUST keep flows obvious and avoid unnecessary steps.
- Simple unit tests: new or changed logic MUST include focused tests where practical.
- Minimal dependencies: new packages MUST be justified and avoid unnecessary stack expansion.

**Post-Phase 1 re-check**: PASS.
- Clean code: the redirect/callback/session flow adds three small, single-purpose endpoints (`/sso/authorize`, `/sso/callback`, `/sso/session`, `/sso/logout`) reusing existing `evaluate_access`/`SsoConfigStore`/`build_oauth_client` — no new abstraction layer.
- Simple UX: sign-in is still one click ("Sign in with `<Provider>`"); failures return to the same `/login` page with a message (FR-010) rather than a new error surface.
- Simple unit tests: callback/session tests will mock Authlib's `authorize_access_token` rather than requiring a live IdP (see research.md's testing note).
- Minimal dependencies: `itsdangerous` is the only addition, and it's a hard transitive requirement of `authlib`'s Starlette integration already accepted in T010b, not a new discretionary choice — see research.md for the full justification.

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
client/
├── src/
│   ├── auth/
│   ├── components/
│   ├── routes/
│   └── api/
└── tests/

server/
├── app/
│   ├── config.py
│   ├── routers/
│   └── models/
└── tests/
```

**Structure Decision**: Implement the feature in the existing TanStack client under client/src and the existing FastAPI server under server/app. The client will own the sign-in flow and access checks, while the server will expose configuration and audit-friendly endpoints as needed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
