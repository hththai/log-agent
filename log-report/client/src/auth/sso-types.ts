export interface SsoProviderConfigPublic {
    id: string
    provider_type: string
    issuer: string
    client_id: string
    redirect_uri: string
    enabled: boolean
    claim_mapping: Record<string, string>
    has_client_secret: boolean
}

export interface SsoProviderConfigInput {
    provider_type: string
    issuer: string
    client_id: string
    client_secret?: string
    redirect_uri: string
    enabled: boolean
    claim_mapping: Record<string, string>
}

export interface AccessMapping {
    id: string
    provider_id: string
    claim_name: string
    expected_value: string
    role: string
    allowed: boolean
    description: string
}

export interface AccessMappingInput {
    id?: string
    claim_name: string
    expected_value: string
    role: string
    allowed: boolean
    description: string
}

export interface DemoModeConfig {
    enabled: boolean
    default_email: string
    allow_local_validation: boolean
}

export interface SsoConfigResponse {
    provider: SsoProviderConfigPublic | null
    demo_mode: DemoModeConfig
}

export interface SsoValidateResponse {
    ready: boolean
    reasons: string[]
}

export interface LoginResult {
    granted: boolean
    role?: string
    email?: string
    reason?: string
}
