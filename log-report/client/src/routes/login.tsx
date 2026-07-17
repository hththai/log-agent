import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState, type FormEventHandler } from 'react'
import { useAuth } from '#/auth/AuthProvider'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const router = useRouter()
    const { isAuthenticated, loginWithSso } = useAuth()
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isAuthenticated) {
            router.navigate({ to: '/' })
        }
    }, [isAuthenticated, router])

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
                    Use an email address to enter the protected reporting experience.
                </p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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

                    {error ? <p className="text-sm text-rose-600">{error}</p> : null}

                    <button
                        className="w-full rounded-lg bg-cyan-600 px-4 py-2 font-medium text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        type="submit"
                    >
                        {isSubmitting ? 'Signing in…' : 'Continue to dashboard'}
                    </button>
                </form>
            </div>
        </main>
    )
}
