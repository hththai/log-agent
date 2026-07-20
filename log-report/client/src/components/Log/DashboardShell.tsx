import { useState, type ReactNode } from 'react'
import { LayoutDashboard, Menu, X } from 'lucide-react'
import { DashboardViewSwitcher, type DashboardView } from './DashboardViewSwitcher'

interface DashboardShellProps {
    readonly activeView: DashboardView
    readonly onViewChange: (view: DashboardView) => void
    readonly showDiagramOption: boolean
    readonly title: string
    readonly subtitle?: string
    readonly badge?: string
    readonly banner?: ReactNode
    readonly headerActions?: ReactNode
    readonly children: ReactNode
}

function Brand({ badge }: Readonly<{ badge?: string }>) {
    return (
        <div className="flex items-center gap-2.5 px-5 py-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Log Collector</span>
                {badge ? (
                    <span className="w-fit rounded-full bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                        {badge}
                    </span>
                ) : (
                    <span className="text-xs text-slate-500 dark:text-slate-400">Analytics</span>
                )}
            </div>
        </div>
    )
}

export function DashboardShell({
    activeView,
    onViewChange,
    showDiagramOption,
    title,
    subtitle,
    badge,
    banner,
    headerActions,
    children,
}: DashboardShellProps) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            {/* Desktop sidebar — persistent on large screens */}
            <aside className="hidden shrink-0 flex-col border-r border-slate-200 bg-white lg:flex lg:w-64 dark:border-slate-800 dark:bg-slate-900">
                <Brand badge={badge} />
                <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-2">
                    <DashboardViewSwitcher activeView={activeView} onChange={onViewChange} showDiagramOption={showDiagramOption} />
                </nav>
            </aside>

            {/* Mobile drawer — mounted only while open */}
            {mobileNavOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <button
                        aria-label="Close navigation"
                        className="absolute inset-0 bg-slate-950/50"
                        onClick={() => setMobileNavOpen(false)}
                        type="button"
                    />
                    <div className="relative flex h-full w-72 max-w-[80vw] flex-col bg-white shadow-xl dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                            <Brand badge={badge} />
                            <button
                                aria-label="Close navigation"
                                className="mr-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                                onClick={() => setMobileNavOpen(false)}
                                type="button"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-3">
                            <DashboardViewSwitcher
                                activeView={activeView}
                                onChange={(view) => { onViewChange(view); setMobileNavOpen(false) }}
                                showDiagramOption={showDiagramOption}
                            />
                        </nav>
                    </div>
                </div>
            )}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Mobile top bar */}
                <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
                    <button
                        aria-label="Open navigation"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => setMobileNavOpen(true)}
                        type="button"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold">Log Collector</span>
                </div>

                <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-5 pr-20 sm:px-6 sm:pr-24 lg:px-8 lg:pr-28 dark:border-slate-800 dark:bg-slate-900">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
                        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
                    </div>
                    {headerActions}
                </header>

                {banner}

                <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
