import { Info } from '@/components/Log/Info'

interface LogInfoBarProps {
    totalRequests: number
    servicesCount: number
    ipCount: number
}

export function LogInfoBar({ totalRequests, servicesCount, ipCount }: LogInfoBarProps) {
    return (
        <div className='flex flex-wrap gap-2'>
            <Info infoName={'Total Request'} value={totalRequests.toString()} />
            <Info infoName={'No Services'} value={servicesCount.toString()} />
            <Info infoName={'No IP'} value={ipCount.toString()} />
        </div>
    )
}
