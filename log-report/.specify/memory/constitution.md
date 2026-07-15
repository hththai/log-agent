<!--
Sync Impact Report
- Version change: 0.1.0 → 1.0.0
- Modified principles: none → Clean Code, Simple UX, Simple Unit Tests, Minimal Dependencies
- Added sections: Architecture Constraints, Development Workflow
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md, ✅ .specify/templates/spec-template.md, ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: TODO(RATIFICATION_DATE): confirm the original adoption date
-->

# Log Report Constitution

## Core Principles

### I. Clean Code
All changes in the Python API under /server and the TanStack TypeScript client under /client MUST be readable, explicit, and maintainable. Functions, routes, services, and components MUST have a single responsibility, use clear names, and favor direct logic over clever abstractions. Type hints, validation, and simple structure MUST be used where they reduce ambiguity, and non-obvious behavior MUST be documented. Rationale: this project combines a Python backend and a TypeScript frontend, so clarity is required to keep changes safe and reviewable.

### II. Simple UX
User-facing workflows MUST be easy to understand and complete in a small number of steps. Core tasks MUST be reachable without hidden navigation, error states MUST be explicit, and the interface MUST avoid unnecessary clutter. Rationale: log reporting and administration experiences are task-focused, so simplicity improves comprehension for operators and reviewers.

### III. Simple Unit Tests
Unit tests MUST be written for new or changed business logic, API handlers, and UI behavior that would otherwise be hard to validate manually. Tests MUST be small, deterministic, and focused on behavior rather than implementation details. Rationale: simple tests catch regressions quickly without turning the project into a test-heavy codebase.

### IV. Minimal Dependencies
New libraries, services, and frameworks MUST be justified by a concrete need that cannot be met with the existing stack. The project MUST prefer the smallest viable change set and existing dependencies already used by the client and server setup. Dependency changes MUST be documented, reviewed, and validated before merge. Rationale: minimal dependencies reduce maintenance overhead, upgrade risk, and build complexity.

## Architecture Constraints
The backend MUST remain the Python API under /server, and the frontend MUST remain the TanStack Start TypeScript application under /client unless a broader architecture decision explicitly changes the stack. Frontend and backend changes MUST preserve the existing Docker Compose workflow and the existing API contract unless a migration plan is documented. User-visible changes MUST remain testable through the relevant build and verification commands for the affected layer.

## Development Workflow
Every feature or fix MUST start from a clear requirement and leave behind verification evidence. Non-trivial changes MUST include relevant tests or validation steps before merge. UI updates MUST be checked at common breakpoints, and API changes MUST preserve compatibility or include a documented migration plan. Reviewers MUST verify compliance with this constitution before approving changes.

## Governance
This constitution supersedes conflicting practices. Amendments MUST be proposed with a concrete rationale, updated documentation, and a version bump. Changes that alter a principle or add a new mandatory rule MUST be reviewed before merge, and compliance review MUST occur during pull request review and before release.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm the original adoption date | **Last Amended**: 2026-07-15
