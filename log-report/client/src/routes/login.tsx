import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEventHandler } from 'react'
import { authorizeUrl, getConfig } from '#/api/sso'
import { useAuth } from '#/auth/AuthProvider'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function GoogleIcon({ className }: Readonly<{ className?: string }>) {
    return (
        <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
            <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
                fill="#FF3D00"
                d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
            />
            <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
        </svg>
    )
}

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
                        className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-center font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-100 dark:hover:bg-slate-200"
                        href={authorizeUrl()}
                    >
                        <GoogleIcon className="h-5 w-5" />
                        Sign in with Google
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
