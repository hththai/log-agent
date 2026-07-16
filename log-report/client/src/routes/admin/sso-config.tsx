import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '#/auth/AuthProvider'
import SsoConfigForm from '#/components/Admin/SsoConfigForm'

export const Route = createFileRoute('/admin/sso-config')({
    component: SsoConfigPage,
})

function SsoConfigPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            router.navigate({ to: '/login' })
        }
    }, [isAuthenticated, router])

    if (!isAuthenticated) {
        return null
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 transition-colors sm:px-6 dark:bg-slate-950 dark:text-slate-100">
            <SsoConfigForm />
        </main>
    )
}
