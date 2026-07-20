import { useQuery } from '@tanstack/react-query'

import { getLogs } from '@/api/log'
import { LogReportView } from '@/components/Log/LogReportView'

interface LogReportProps {
    readonly userEmail?: string
    readonly onLogout?: () => void
}

export function LogReport({ userEmail, onLogout }: LogReportProps) {
    const { isPending, error, data } = useQuery({
        queryKey: ['logData'],
        queryFn: getLogs,
    })

    if (isPending) return 'Loading...'
    if (error) return 'An error has occurred: ' + error.message

    return <LogReportView data={data} userEmail={userEmail} onLogout={onLogout} />
}

export default LogReport;
