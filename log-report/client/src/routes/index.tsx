import LogReport from '#/components/Log/LogReport'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '#/auth/AuthProvider'

export const Route = createFileRoute('/')({ component: Home })

const queryClient = new QueryClient()

function Home() {
  const router = useRouter()
  const { isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: '/login' })
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                Dashboard
              </p>
              <h1 className="text-3xl font-semibold">Welcome to your service dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Your signed-in session now unlocks the reporting experience directly from the home view.
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
          <LogReport />
        </div>
      </main>
    </QueryClientProvider>
  )
}
