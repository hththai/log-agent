import { Activity, Globe, Server } from 'lucide-react'
import { Info } from '@/components/Log/Info'

interface LogInfoBarProps {
    totalRequests: number
    servicesCount: number
    ipCount: number
}

export function LogInfoBar({ totalRequests, servicesCount, ipCount }: LogInfoBarProps) {
    return (
        <div className="flex flex-wrap gap-3">
            <Info icon={Activity} infoName="Total Requests" value={totalRequests.toLocaleString()} />
            <Info icon={Server} infoName="Services" value={servicesCount.toString()} />
            <Info icon={Globe} infoName="Unique IPs" value={ipCount.toString()} />
        </div>
    )
}
