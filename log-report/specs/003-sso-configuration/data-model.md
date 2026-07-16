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
