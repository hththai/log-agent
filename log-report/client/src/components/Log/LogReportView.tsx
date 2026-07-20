import { useState, type ReactNode } from 'react'
import { LogInfoBar } from '@/components/Log/LogInfoBar'
import LogTable from '@/components/Log/LogTable'
import LogPie from '@/components/Log/LogPie'

import type { ServiceCount, LogsResponse } from '@/api/log'
import { LogNetworkGraph } from './LogNetworkGraph'
import { DashboardShell } from './DashboardShell'
import type { DashboardView } from './DashboardViewSwitcher'

interface LogReportViewProps {
    readonly data: LogsResponse
    readonly userEmail?: string
    readonly onLogout?: () => void
    readonly banner?: ReactNode
    readonly badge?: string
}

export function LogReportView({ data, userEmail, onLogout, banner, badge }: LogReportViewProps) {
    const [selectedService, setSelectedService] = useState<string | null>(null)
    const [activeView, setActiveView] = useState<DashboardView>('table')

    const filteredItems = selectedService
        ? data.items.filter(item => item.name_service === selectedService)
        : data.items

    const totalRequests = filteredItems.length
    const services = [...new Set(filteredItems.map(item => item.name_service))]
    const noIp = [...new Set(filteredItems.map(item => item.ip))]

    const serviceCount: ServiceCount[] = getNumberOfServices(data);

    return (
        <DashboardShell
            activeView={activeView}
            onViewChange={setActiveView}
            showDiagramOption={true}
            badge={badge}
            title={activeView === 'table' ? 'Overview' : 'Network Diagram'}
            subtitle={
                activeView === 'table'
                    ? 'Request volume, services, and traffic breakdown'
                    : 'IP-to-service traffic relationships'
            }
            banner={banner}
            headerActions={onLogout ? (
                <div className="flex items-center gap-3">
                    {userEmail && (
                        <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">{userEmail}</span>
                    )}
                    <button
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={onLogout}
                        type="button"
                    >
                        Log out
                    </button>
                </div>
            ) : undefined}
        >
            {activeView === 'table' && (
                <>
                    <LogInfoBar totalRequests={totalRequests} servicesCount={services.length} ipCount={noIp.length} />
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        <div className="xl:col-span-2">
                            <LogTable data={data.items} serviceFilter={selectedService} />
                        </div>
                        <LogPie data={serviceCount} name={"Services Type Portion"} onSliceClick={setSelectedService} />
                    </div>
                </>
            )}
            {activeView === 'diagram' && (
                <LogNetworkGraph data={data.items} />
            )}
        </DashboardShell>
    )

    function getNumberOfServices(data: LogsResponse) {
        const serviceCountMap = data?.items?.reduce<Record<string, number>>((acc, item) => {
            const key = item.name_service
            acc[key] = (acc[key] || 0) + 1
            return acc
        }, {})

        const serviceCount: ServiceCount[] = Object.entries(serviceCountMap).map(
            ([name_service, count]) => ({
                name_service,
                count,
            })
        )
        return serviceCount
    }
}
