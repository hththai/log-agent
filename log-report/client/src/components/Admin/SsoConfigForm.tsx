import { useEffect, useState, type FormEventHandler } from 'react'
import { getConfig, saveConfig, validateConfig } from '#/api/sso'
import type { SsoValidateResponse } from '#/auth/sso-types'

const ADMIN_TOKEN_STORAGE_KEY = 'sso-admin-token'

interface FormState {
    providerType: string
    issuer: string
    clientId: string
    clientSecret: string
    redirectUri: string
    enabled: boolean
    claimMappingText: string
    demoModeEnabled: boolean
    demoDefaultEmail: string
    demoAllowLocalValidation: boolean
}

const EMPTY_FORM: FormState = {
    providerType: 'oidc',
    issuer: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    enabled: true,
    claimMappingText: '',
    demoModeEnabled: false,
    demoDefaultEmail: '',
    demoAllowLocalValidation: true,
}

function parseClaimMapping(text: string): Record<string, string> {
    const mapping: Record<string, string> = {}
    for (const line of text.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const [key, ...rest] = trimmed.split('=')
        if (key && rest.length > 0) {
            mapping[key.trim()] = rest.join('=').trim()
        }
    }
    return mapping
}

export default function SsoConfigForm() {
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [hasStoredSecret, setHasStoredSecret] = useState(false)
    const [adminToken, setAdminToken] = useState(
        () => (typeof window === 'undefined' ? '' : window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? ''),
    )
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' | 'error'; message?: string }>({
        kind: 'idle',
    })
    const [validation, setValidation] = useState<SsoValidateResponse | null>(null)
    const [isValidating, setIsValidating] = useState(false)

    useEffect(() => {
        let cancelled = false
        getConfig()
            .then((res) => {
                if (cancelled) return
                if (res.provider) {
                    setForm((prev) => ({
                        ...prev,
                        providerType: res.provider!.provider_type,
                        issuer: res.provider!.issuer,
                        clientId: res.provider!.client_id,
                        redirectUri: res.provider!.redirect_uri,
                        enabled: res.provider!.enabled,
                        claimMappingText: Object.entries(res.provider!.claim_mapping)
                            .map(([k, v]) => `${k}=${v}`)
                            .join('\n'),
                        demoModeEnabled: res.demo_mode.enabled,
                        demoDefaultEmail: res.demo_mode.default_email,
                        demoAllowLocalValidation: res.demo_mode.allow_local_validation,
                    }))
                    setHasStoredSecret(res.provider.has_client_secret)
                }
            })
            .catch(() => {
                if (!cancelled) setStatus({ kind: 'error', message: 'Failed to load the current SSO configuration.' })
            })
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (adminToken) {
            window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, adminToken)
        } else {
            window.sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY)
        }
    }, [adminToken])

    function validateFields(): boolean {
        const errors: Record<string, string> = {}
        if (!form.providerType.trim()) errors.providerType = 'Provider type is required.'
        if (!form.issuer.trim()) errors.issuer = 'Issuer is required.'
        if (!form.clientId.trim()) errors.clientId = 'Client ID is required.'
        if (!form.redirectUri.trim()) errors.redirectUri = 'Redirect URI is required.'
        if (!adminToken.trim()) errors.adminToken = 'Admin token is required to save changes.'
        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault()
        setValidation(null)

        if (!validateFields()) {
            setStatus({ kind: 'error', message: 'Fix the highlighted fields before saving.' })
            return
        }

        setStatus({ kind: 'saving' })
        try {
            const res = await saveConfig(
                {
                    provider: {
                        provider_type: form.providerType.trim(),
                        issuer: form.issuer.trim(),
                        client_id: form.clientId.trim(),
                        client_secret: form.clientSecret.trim() || undefined,
                        redirect_uri: form.redirectUri.trim(),
                        enabled: form.enabled,
                        claim_mapping: parseClaimMapping(form.claimMappingText),
                    },
                    demo_mode: {
                        enabled: form.demoModeEnabled,
                        default_email: form.demoDefaultEmail.trim(),
                        allow_local_validation: form.demoAllowLocalValidation,
                    },
                },
                adminToken,
            )
            setHasStoredSecret(res.provider?.has_client_secret ?? false)
            setForm((prev) => ({ ...prev, clientSecret: '' }))
            setStatus({ kind: 'saved', message: 'SSO configuration saved.' })
        } catch (err) {
            setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to save configuration.' })
        }
    }

    const handleValidate = async () => {
        if (!adminToken.trim()) {
            setFieldErrors((prev) => ({ ...prev, adminToken: 'Admin token is required to validate.' }))
            return
        }
        setIsValidating(true)
        setValidation(null)
        try {
            const result = await validateConfig(adminToken)
            setValidation(result)
        } catch (err) {
            setStatus({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to validate configuration.' })
        } finally {
            setIsValidating(false)
        }
    }

    return (
        <form
            className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 dark:border-slate-800 dark:bg-slate-900"
            onSubmit={handleSubmit}
        >
            <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                    SSO configuration
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Identity provider settings</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Define an OIDC-style provider (e.g. Google, Okta, Azure AD) and an optional demo-mode fallback for
                    local validation.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                    label="Provider type"
                    htmlFor="providerType"
                    error={fieldErrors.providerType}
                >
                    <input
                        id="providerType"
                        className={inputClass(Boolean(fieldErrors.providerType))}
                        value={form.providerType}
                        onChange={(e) => setForm((prev) => ({ ...prev, providerType: e.target.value }))}
                        placeholder="oidc"
                    />
                </Field>

                <Field label="Client ID" htmlFor="clientId" error={fieldErrors.clientId}>
                    <input
                        id="clientId"
                        className={inputClass(Boolean(fieldErrors.clientId))}
                        value={form.clientId}
                        onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                    />
                </Field>

                <Field label="Issuer" htmlFor="issuer" error={fieldErrors.issuer} full>
                    <input
                        id="issuer"
                        className={inputClass(Boolean(fieldErrors.issuer))}
                        value={form.issuer}
                        onChange={(e) => setForm((prev) => ({ ...prev, issuer: e.target.value }))}
                        placeholder="https://accounts.google.com"
                    />
                </Field>

                <Field label="Redirect URI" htmlFor="redirectUri" error={fieldErrors.redirectUri} full>
                    <input
                        id="redirectUri"
                        className={inputClass(Boolean(fieldErrors.redirectUri))}
                        value={form.redirectUri}
                        onChange={(e) => setForm((prev) => ({ ...prev, redirectUri: e.target.value }))}
                        placeholder="https://app.example.com/sso/callback"
                    />
                </Field>

                <Field
                    label={hasStoredSecret ? 'Client secret (leave blank to keep current)' : 'Client secret'}
                    htmlFor="clientSecret"
                    full
                >
                    <input
                        id="clientSecret"
                        type="password"
                        className={inputClass(false)}
                        value={form.clientSecret}
                        onChange={(e) => setForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                        placeholder={hasStoredSecret ? '••••••••' : ''}
                    />
                </Field>

                <Field label="Claim mapping (one key=value per line)" htmlFor="claimMapping" full>
                    <textarea
                        id="claimMapping"
                        rows={3}
                        className={inputClass(false)}
                        value={form.claimMappingText}
                        onChange={(e) => setForm((prev) => ({ ...prev, claimMappingText: e.target.value }))}
                        placeholder="email=email"
                    />
                </Field>

                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                        type="checkbox"
                        checked={form.enabled}
                        onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                    />
                    Provider enabled
                </label>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold">Demo mode fallback</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                        <input
                            type="checkbox"
                            checked={form.demoModeEnabled}
                            onChange={(e) => setForm((prev) => ({ ...prev, demoModeEnabled: e.target.checked }))}
                        />
                        Allow demo-mode sign-in for local validation
                    </label>
                    <Field label="Default demo email" htmlFor="demoDefaultEmail">
                        <input
                            id="demoDefaultEmail"
                            className={inputClass(false)}
                            value={form.demoDefaultEmail}
                            onChange={(e) => setForm((prev) => ({ ...prev, demoDefaultEmail: e.target.value }))}
                            placeholder="demo@example.com"
                        />
                    </Field>
                </div>
            </div>

            <Field
                label="Admin token"
                htmlFor="adminToken"
                error={fieldErrors.adminToken}
                hint="Required to save or validate. Kept only in this browser session, never in localStorage."
            >
                <input
                    id="adminToken"
                    type="password"
                    className={inputClass(Boolean(fieldErrors.adminToken))}
                    value={adminToken}
                    onChange={(e) => setAdminToken(e.target.value)}
                />
            </Field>

            {status.kind === 'error' ? <p className="text-sm text-rose-600">{status.message}</p> : null}
            {status.kind === 'saved' ? <p className="text-sm text-emerald-600">{status.message}</p> : null}

            {validation ? (
                <div
                    className={`rounded-lg border p-3 text-sm ${
                        validation.ready
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'
                    }`}
                >
                    {validation.ready ? (
                        'Configuration is ready for sign-in.'
                    ) : (
                        <ul className="list-inside list-disc">
                            {validation.reasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                            ))}
                        </ul>
                    )}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
                <button
                    className="rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-700 disabled:opacity-60"
                    type="submit"
                    disabled={status.kind === 'saving'}
                >
                    {status.kind === 'saving' ? 'Saving…' : 'Save configuration'}
                </button>
                <button
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    type="button"
                    onClick={handleValidate}
                    disabled={isValidating}
                >
                    {isValidating ? 'Validating…' : 'Validate configuration'}
                </button>
            </div>
        </form>
    )
}

function inputClass(hasError: boolean) {
    return `w-full rounded-lg border bg-slate-50 px-3 py-2 outline-none focus:border-cyan-500 dark:bg-slate-800 ${
        hasError ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700'
    }`
}

function Field({
    label,
    htmlFor,
    error,
    hint,
    full,
    children,
}: Readonly<{
    label: string
    htmlFor: string
    error?: string
    hint?: string
    full?: boolean
    children: React.ReactNode
}>) {
    return (
        <div className={full ? 'sm:col-span-2' : undefined}>
            <label className="block text-sm font-medium" htmlFor={htmlFor}>
                {label}
            </label>
            <div className="mt-1">{children}</div>
            {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
            {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
        </div>
    )
}
