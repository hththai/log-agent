import type {
    AccessMapping,
    AccessMappingInput,
    DemoModeConfig,
    LoginResult,
    SsoConfigResponse,
    SsoProviderConfigInput,
    SsoValidateResponse,
} from '#/auth/sso-types'

// Mirrors client/src/api/log.tsx: dev hits the FastAPI server directly,
// prod goes through the Nitro '/api/**' proxy rule (see vite.config.ts),
// which strips the /api prefix before forwarding to the bare backend route.
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : '/api'

interface SaveConfigInput {
    provider: SsoProviderConfigInput
    demo_mode?: DemoModeConfig
}

async function parseOrThrow<T>(res: Response, fallbackMessage: string): Promise<T> {
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('Admin token is missing or incorrect.')
        }
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail ?? fallbackMessage)
    }
    return res.json()
}

export async function getConfig(): Promise<SsoConfigResponse> {
    const res = await fetch(`${API_BASE}/sso/config`)
    return parseOrThrow(res, 'Failed to fetch SSO configuration')
}

export async function saveConfig(payload: SaveConfigInput, adminToken: string): Promise<SsoConfigResponse> {
    const res = await fetch(`${API_BASE}/sso/config`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ ...payload.provider, demo_mode: payload.demo_mode }),
    })
    return parseOrThrow(res, 'Failed to save SSO configuration')
}

export async function validateConfig(adminToken: string): Promise<SsoValidateResponse> {
    const res = await fetch(`${API_BASE}/sso/validate`, {
        method: 'POST',
        headers: { 'X-Admin-Token': adminToken },
    })
    return parseOrThrow(res, 'Failed to validate SSO configuration')
}

export async function getMappings(): Promise<AccessMapping[]> {
    const res = await fetch(`${API_BASE}/sso/mappings`)
    return parseOrThrow(res, 'Failed to fetch access mappings')
}

export async function saveMapping(payload: AccessMappingInput, adminToken: string): Promise<AccessMapping> {
    const res = await fetch(`${API_BASE}/sso/mappings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(payload),
    })
    return parseOrThrow(res, 'Failed to save access mapping')
}

export async function deleteMapping(id: string, adminToken: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sso/mappings/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Token': adminToken },
    })
    if (!res.ok) {
        await parseOrThrow(res, 'Failed to delete access mapping')
    }
}

export async function login(email: string): Promise<LoginResult> {
    const res = await fetch(`${API_BASE}/sso/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
    return parseOrThrow(res, 'Sign-in failed')
}

// Used as a plain navigation href (e.g. <a href={authorizeUrl()}>) — the
// browser needs a real top-level redirect to the IdP, not a fetch call.
export function authorizeUrl(): string {
    return `${API_BASE}/sso/authorize`
}

export async function getSession(): Promise<LoginResult> {
    const res = await fetch(`${API_BASE}/sso/session`, { credentials: 'include' })
    return parseOrThrow(res, 'Failed to fetch session')
}

export async function logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/sso/logout`, {
        method: 'POST',
        credentials: 'include',
    })
    if (!res.ok) {
        await parseOrThrow(res, 'Failed to log out')
    }
}
