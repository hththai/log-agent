import type { LucideIcon } from 'lucide-react'

interface CardProps {
    infoName: string
    value: string
    icon?: LucideIcon
}

export const Info = ({ infoName, value, icon: Icon }: CardProps) => {
    return (
        <div className="flex min-w-[160px] flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {Icon ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
            ) : null}
            <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {infoName}
                </span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {value}
                </span>
            </div>
        </div>
    )
}
