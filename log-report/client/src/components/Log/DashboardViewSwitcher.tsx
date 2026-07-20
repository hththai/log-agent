import { Table2, Waypoints } from 'lucide-react'

export type DashboardView = 'table' | 'diagram'

interface DashboardViewSwitcherProps {
    activeView: DashboardView
    onChange: (view: DashboardView) => void
    showDiagramOption: boolean
}

const activeClasses = 'bg-cyan-600 text-white shadow-sm'
const inactiveClasses = 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'

export function DashboardViewSwitcher({ activeView, onChange, showDiagramOption }: DashboardViewSwitcherProps) {
    return (
        <div role="group" aria-label="Dashboard view" className="flex flex-col gap-1">
            <button
                type="button"
                aria-pressed={activeView === 'table'}
                onClick={() => onChange('table')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeView === 'table' ? activeClasses : inactiveClasses}`}
            >
                <Table2 className="size-5 shrink-0" aria-hidden="true" />
                Table & Chart
            </button>
            {showDiagramOption && (
                <button
                    type="button"
                    aria-pressed={activeView === 'diagram'}
                    onClick={() => onChange('diagram')}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${activeView === 'diagram' ? activeClasses : inactiveClasses}`}
                >
                    <Waypoints className="size-5 shrink-0" aria-hidden="true" />
                    Network Diagram
                </button>
            )}
        </div>
    )
}
