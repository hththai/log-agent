import Info from '@/components/Log/Info'
import LogTable from '@/components/Log/LogTable'
import { useQuery } from '@tanstack/react-query'

import { getLogs } from '@/api/log'

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
    return (
        <div className='flex flex-col justify-center gap-4'>
            <div className='flex gap-x-2' >
                <Info infoName={'Total Request'} value={data.total.toString()} />
                <Info infoName={'No Services'} value={services.length.toString()} />
                <Info infoName={'No IP'} value={noIp.length.toString()} />
            </div>
            <LogTable data={data.items} />
        </div>
    )
}



export default LogReport;