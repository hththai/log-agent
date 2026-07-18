# Data Model: Flexible Secure SSO Configuration

## Entities

### SSO Provider Configuration
- id: string
- providerType: string
- issuer: string
- clientId: string
- clientSecret: string (stored securely, not exposed in logs)
- redirectUri: string
- enabled: boolean
- claimMapping: object

### Access Mapping
- id: string
- providerId: string
- claimName: string
- expectedValue: string
- role: string
- allowed: boolean
- description: string

### User Identity
- providerId: string
- subject: string
- email: string
- groups: string[]
- roles: string[]

### Access Policy
- id: string
- name: string
- conditions: object[]
- allow: boolean
- description: string

### Demo Mode Configuration
- enabled: boolean
- defaultEmail: string
- allowLocalValidation: boolean

### Session (ephemeral — not persisted to `sso_config.json` or any table)
- email: string
- role: string
- providerId: string

Written to a server-signed session cookie (Starlette `SessionMiddleware`) only after `GET /sso/callback` verifies the identity provider's token and `evaluate_access` grants a role (FR-009/FR-011). Read by `GET /sso/session` for the SPA to restore auth state on load; cleared by `POST /sso/logout`. The OAuth `state`/`nonce` Authlib uses during the redirect round trip live in the same session mechanism but are Authlib-internal and not part of this entity's shape.
