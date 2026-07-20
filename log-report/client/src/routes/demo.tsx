import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { generateDemoLogsResponse } from '#/api/demoLog'
import { LogReportView } from '#/components/Log/LogReportView'
import type { LogsResponse } from '#/api/log'

export const Route = createFileRoute('/demo')({
    component: DemoPage,
})

function generateDatasetSafely(): LogsResponse | null {
    try {
        return generateDemoLogsResponse()
    } catch {
        return null
    }
}

export function DemoPage() {
    const [dataset] = useState<LogsResponse | null>(generateDatasetSafely)

    if (!dataset) {
        return (
            <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Demo preview unavailable — please retry.
                </p>
            </main>
        )
    }

    return (
        <LogReportView
            data={dataset}
            badge="Demo"
            banner={
                <div className="flex flex-col gap-2 border-b border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100">
                    <span>You're viewing sample data — not live production data.</span>
                    <a
                        className="font-medium underline underline-offset-2 hover:no-underline"
                        href="/login"
                    >
                        Sign in
                    </a>
                </div>
            }
        />
    )
}
