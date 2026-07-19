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

    return (
        <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                {dataset ? (
                    <>
                        <div className="flex flex-col gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-100">
                            <span>You're viewing sample data — not live production data.</span>
                            <a
                                className="font-medium underline underline-offset-2 hover:no-underline"
                                href="/login"
                            >
                                Sign in
                            </a>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600 dark:text-cyan-400">
                                Demo dashboard
                            </p>
                            <h1 className="text-3xl font-semibold">Explore the reporting experience</h1>
                        </div>
                        <LogReportView data={dataset} />
                    </>
                ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Demo preview unavailable — please retry.
                    </p>
                )}
            </div>
        </main>
    )
}
