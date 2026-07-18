# Quickstart: Flexible Secure SSO Configuration

## Prerequisites
- Existing client and server app running locally
- Access to the dashboard route for admin validation
- A real (or test) OIDC provider registration (client ID/secret, authorized redirect URI set to `http://localhost:8000/sso/callback`) to exercise the production path; the demo-mode steps below don't need one

## Validate the production sign-in flow (FR-009/FR-010/FR-011)
1. As an admin, configure a provider via `/admin/sso-config` (or `POST /sso/config`) with `redirect_uri` set to `http://localhost:8000/sso/callback`, and add at least one access mapping for the account you'll sign in with.
2. From `/login`, select "Sign in with `<Provider>`" and confirm the browser is redirected to the provider's real sign-in page — not just a local form.
3. Authenticate with the provider and confirm you land back on the app's single protected route (the same destination regardless of which role your mapping granted).
4. Sign out, then deliberately cancel/deny consent at the provider (or reload `/sso/callback` without a valid code) and confirm you're returned to `/login` with a clear error message, not signed in.
5. Update the access mapping or disable the provider and confirm the new rule takes effect on the next sign-in attempt without a code change.

## Validate the demo-mode fallback (FR-007) — separate from the above
6. Enable demo mode locally and confirm signing in via the plain email field (`POST /sso/login`) still requires a matching access mapping — it does not bypass the access-control rules, and it remains available only as a local-only stand-in, not a replacement for steps 1-5.
