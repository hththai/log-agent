import Info from '@/components/Log/Info'
import LogTable from '@/components/Log/LogTable'
import LogPie from '@/components/Log/LogPie'
import { useQuery } from '@tanstack/react-query'

import { getLogs } from '@/api/log'
import type { ServiceCount, LogsResponse } from '@/api/log'

export function LogReport() {
    const { isPending, error, data } = useQuery({
        queryKey: ['logData'],
        queryFn: getLogs,
    })

    if (isPending) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

    // Get number of distinct services
    const services = data?.items ? [...new Set(data.items.map((item => item.name_service)))] : [];

    // Get number of ip
    const noIp = data?.items ? [...new Set(data.items.map((item => item.ip)))] : []

    const serviceCount: ServiceCount[] = getNumberOfServices(data);

    return (
        <div className='flex flex-col justify-center gap-4'>
            <div className='flex gap-x-2' >
                <Info infoName={'Total Request'} value={data.total.toString()} />
                <Info infoName={'No Services'} value={services.length.toString()} />
                <Info infoName={'No IP'} value={noIp.length.toString()} />
            </div>
            <LogTable data={data.items} />
            <LogPie data={serviceCount} name={"Services Type Portion"} />
        </div>
    )

    function getNumberOfServices(data: LogsResponse) {
        // const serviceCount: ServiceCount[] = [
        //     { name_service: 'doc_invoice', count: 50 },
        //     { name_service: 'doc_service', count: 3400 }]
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



export default LogReport;