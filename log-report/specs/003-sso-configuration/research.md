# Research: Flexible Secure SSO Configuration

## Decision: Adopt a config-driven OIDC-style SSO foundation with a demo-mode fallback

**Rationale**: The feature request prioritizes flexibility and secure governance. An OIDC-style configuration model supports multiple identity providers and keeps provider-specific logic configurable rather than hard-coded. The demo-mode fallback remains available for local validation without replacing the production access-control path.

## Alternatives considered

- Single-provider integration only: rejected because it would limit adaptability and conflict with the requirement for flexible configuration.
- Email-only demo auth: rejected as the primary path because it would not satisfy the secure SSO requirement.
- Full custom identity provider implementation: rejected because it would add unnecessary complexity and dependencies relative to the current stack.

## Decision: Redirect-based sign-in, callback token verification, and session handling (FR-009/FR-010/FR-011)

**Context**: `/speckit-clarify` established that the production sign-in path MUST be a real redirect to the identity provider with verified-token evaluation, distinct from the demo-mode email entry already built (T026). The client is currently a pure SPA with client-only session state (`AuthProvider` persists `{email, role}` to `localStorage`, with no server-verified session concept) — that model cannot express "the server verified a token," so it needs a companion server-side session for the production path.

**Decision**: Use Authlib's existing Starlette OAuth client (`build_oauth_client`, already added in T010b) to drive the full flow, backed by Starlette's built-in `SessionMiddleware`:

- `GET /sso/authorize` redirects the browser to the provider's authorization endpoint via `oauth_client.authorize_redirect(request, redirect_uri)`. Authlib stores the CSRF `state` and OIDC `nonce` in the request session for verification on return.
- `GET /sso/callback` (the path the provider redirects back to) calls `oauth_client.authorize_access_token(request)`, which exchanges the code for tokens **and verifies the ID token's signature, issuer, audience, and nonce** against the provider's JWKS — this is what satisfies "verify the returned identity token" in FR-009, without hand-rolling JWT verification.
- On success, the resolved `UserIdentity` is evaluated via the existing `evaluate_access` (T025); the granted `{email, role}` is written into the same signed session (FR-011: this session, not localStorage, becomes the source of truth), and the browser is redirected to the single landing route.
- On denial, missing-attribute, or any Authlib exception (state mismatch, user cancelled consent, invalid callback), the browser is redirected to `/login?error=<message>` (FR-010) — no session is created.
- `GET /sso/session` lets the SPA ask "am I signed in?" on load (reads the cookie via `request.session`, returns the same granted/role/email shape `POST /sso/login` already returns). `POST /sso/logout` clears it. `AuthProvider` calls `GET /sso/session` on mount instead of trusting `localStorage` alone — `localStorage` becomes a paint-avoidance hint, the cookie is authoritative.

**Rationale**: Authlib's own Starlette integration *requires* `request.session` to exist for state/nonce handling — `SessionMiddleware` isn't optional plumbing we're choosing to add for convenience, it's a hard prerequisite of the dependency already accepted in T010b. Reusing that same signed cookie for the app's own post-login session (rather than inventing a second, separate signing mechanism) is the smallest viable addition, consistent with the Minimal Dependencies principle.

**New dependency**: `itsdangerous` (`SessionMiddleware`'s signer). Not currently installed — Starlette does not bundle it by default. Justification: required transitively by `authlib`'s Starlette OAuth client for state/nonce storage; reused for the app's session cookie instead of adding a second signing library.

**Alternatives considered**:
- Client-side-only "session" using an ID token stored in `localStorage`/memory and re-verified by the SPA: rejected — a browser-storable token that the SPA itself judges is exactly the "not really secured" gap the clarification was raised to close; verification must happen server-side, once, at the callback.
- Hand-rolled JWT verification (fetch JWKS, check signature manually): rejected — Authlib already does this correctly as part of `authorize_access_token`; hand-rolling would duplicate a well-tested library capability and add security risk for no benefit.
- A one-time token in the callback redirect's query string that the SPA exchanges via `fetch`, avoiding cookies entirely: rejected — leaks a bearer credential into browser history/referrer headers and still needs *some* server-side session afterward; a cookie is the standard, safer place for this state.
