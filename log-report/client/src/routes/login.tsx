import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEventHandler } from 'react'
import { authorizeUrl, getConfig } from '#/api/sso'
import { useAuth } from '#/auth/AuthProvider'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function readCallbackError(): string {
    if (typeof window === 'undefined') {
        return ''
    }
    return new URLSearchParams(window.location.search).get('error') ?? ''
}

function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, loginWithSso } = useAuth()
    const [email, setEmail] = useState('')
    const [error, setError] = useState(() => readCallbackError())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [providerLabel, setProviderLabel] = useState<string | null>(null)

    useEffect(() => {
        if (isAuthenticated) {
            router.navigate({ to: '/' })
        }
    }, [isAuthenticated, router])

    useEffect(() => {
        getConfig()
            .then((config) => {
                if (config.provider?.enabled) {
                    setProviderLabel(config.provider.provider_type)
                }
            })
            .catch(() => {
                // No provider reachable — the demo-mode form below remains available.
            })
    }, [])

    const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault()

        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            setError('Please enter your email address.')
            return
        }

        setError('')
        setIsSubmitting(true)
        const result = await loginWithSso(trimmedEmail)
        setIsSubmitting(false)

        if (result.granted) {
            router.navigate({ to: '/' })
        } else {
            setError(result.reason ?? 'Access denied.')
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                    Secure access
                </p>
                <h1 className="mt-3 text-3xl font-semibold">Sign in to the dashboard</h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    Use your organization's identity provider to enter the protected reporting experience.
                </p>

                {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

                {providerLabel ? (
                    <a
                        className="mt-6 block w-full rounded-lg bg-cyan-600 px-4 py-2 text-center font-medium text-white transition hover:bg-cyan-700"
                        href={authorizeUrl()}
                    >
                        Sign in with {providerLabel}
                    </a>
                ) : null}

                <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                        Demo mode fallback
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Local validation only — not a substitute for signing in above.
                    </p>

                    <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                        <label className="block text-sm font-medium" htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none ring-0 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800"
                            name="email"
                            placeholder="name@example.com"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value)
                                setError('')
                            }}
                        />

                        <button
                            className="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            disabled={isSubmitting}
                            type="submit"
                        >
                            {isSubmitting ? 'Signing in…' : 'Continue with demo email'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    )
}
