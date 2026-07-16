import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '#/auth/AuthProvider'

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    const router = useRouter()
    const { isAuthenticated, logout, user } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            router.navigate({ to: '/login' })
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated) {
        return null
    }

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                            Protected workspace
                        </p>
                        <h1 className="text-3xl font-semibold">Welcome back, {user?.email ?? 'admin'}</h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Your authenticated session now unlocks the reporting experience.
                        </p>
                    </div>
                    <button
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => {
                            logout()
                            router.navigate({ to: '/login' })
                        }}
                        type="button"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </main>
    )
}
