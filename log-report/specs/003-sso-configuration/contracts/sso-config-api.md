# SSO Configuration API Contract

## Overview

This contract defines the minimal configuration and access-control endpoints needed for the SSO feature.

Endpoints are mounted on the FastAPI app without an `/api` prefix (e.g. `/sso/config`); the browser-facing `/api/sso/...` path shown below is the externally visible path after the client's dev/prod proxy rule strips `/api` (see tasks.md's routing convention note). Endpoints marked **Admin** require the `X-Admin-Token` header; all others are unauthenticated by design (either safe-to-expose reads, or the end-user sign-in surface itself).

## Endpoints

### GET /api/sso/config
Returns the active SSO configuration state that is safe to expose to the client (redacted — no `client_secret`).

### POST /api/sso/config — **Admin**
Stores or updates SSO provider configuration and demo-mode settings.

### GET /api/sso/mappings
Returns configured access mappings.

### POST /api/sso/mappings — **Admin**
Creates or updates an access mapping.

### DELETE /api/sso/mappings/{id} — **Admin**
Removes an access mapping. (Implementation status: not yet built — tracked as future work, US3/T034.)

### POST /api/sso/validate — **Admin**
Validates a provider configuration (required fields, live OIDC discovery-document fetch) and returns whether it is ready for sign-in.

### POST /api/sso/login
Demo-mode-only sign-in: accepts `{ email }`, resolves an identity directly from the submitted email, evaluates it against access mappings, and returns `{ granted, role?, email?, reason? }`. Does **not** verify the caller owns the email — this is the local-validation fallback (FR-007), not the production path.

### GET /api/sso/authorize
Production sign-in entry point. No request body — redirects the browser (302) to the configured provider's authorization endpoint, with Authlib managing CSRF `state` and OIDC `nonce` via the session cookie. Returns 503 if no provider is configured/enabled.

### GET /api/sso/callback
The provider's configured `redirect_uri` target. Exchanges the authorization code for tokens and **verifies the ID token's signature/issuer/audience/nonce** via Authlib, resolves a `UserIdentity` from its claims, and evaluates access mappings (FR-009). On grant: writes `{ email, role, providerId }` to the signed session cookie and redirects (302) to the SPA's single landing route (FR-011). On denial, missing-attribute, or any callback error (including the user cancelling consent at the provider): redirects (302) to `/login?error=<message>` without creating a session (FR-010).

### GET /api/sso/session
Returns the current session's identity, if any, in the same shape as `POST /sso/login`'s response (`{ granted, role?, email? }`, with `granted: false` and no session cookie present). Used by the SPA on load to restore/verify auth state from the cookie rather than trusting `localStorage` alone.

### POST /api/sso/logout
Clears the session cookie. Idempotent — safe to call with no active session.
