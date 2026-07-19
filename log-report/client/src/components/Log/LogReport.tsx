import { useQuery } from '@tanstack/react-query'

import { getLogs } from '@/api/log'
import { LogReportView } from '@/components/Log/LogReportView'

export function LogReport() {
    const { isPending, error, data } = useQuery({
        queryKey: ['logData'],
        queryFn: getLogs,
    })

    if (isPending) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

    return <LogReportView data={data} />
}

export default LogReport;
