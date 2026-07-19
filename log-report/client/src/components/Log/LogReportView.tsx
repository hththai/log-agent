import { useState } from 'react'
import { LogInfoBar } from '@/components/Log/LogInfoBar'
import LogTable from '@/components/Log/LogTable'
import LogPie from '@/components/Log/LogPie'

import type { ServiceCount, LogsResponse } from '@/api/log'
import { LogIpReport } from './LogIpReport'
import { LogNetworkGraph } from './LogNetworkGraph'

export function LogReportView({ data }: { readonly data: LogsResponse }) {
    const [selectedService, setSelectedService] = useState<string | null>(null)

    const filteredItems = selectedService
        ? data.items.filter(item => item.name_service === selectedService)
        : data.items

    const totalRequests = filteredItems.length
    const services = [...new Set(filteredItems.map(item => item.name_service))]
    const noIp = [...new Set(filteredItems.map(item => item.ip))]

    const serviceCount: ServiceCount[] = getNumberOfServices(data);

    return (
        <div className='flex flex-col justify-center gap-4'>
            <LogInfoBar totalRequests={totalRequests} servicesCount={services.length} ipCount={noIp.length} />
            <LogTable data={data.items} serviceFilter={selectedService} />
            <LogPie data={serviceCount} name={"Services Type Portion"} onSliceClick={setSelectedService} />
            {/* <LogIpReport data={data.items} /> */}
            <LogNetworkGraph data={data.items} />
        </div>
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
