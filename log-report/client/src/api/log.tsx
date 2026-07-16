export interface LogItem {
    id: number
    log_time: string
    level: string
    ip: string
    method: string
    path: string
    status: number
    duration_ms: number
    name_service: string
}

export interface LogsResponse {
    table: string
    total: number
    page: number
    page_size: number
    items: LogItem[]
}

export interface ServiceCount {
    name_service: string
    count: number
}

export interface LogsQuery {
    page?: number
    pageSize?: number
    service?: string
    reportType?: string
    fromTime?: string
    toTime?: string
}

// configure dev environment.
const API_BASE = import.meta.env.DEV ? 'http://localhost:8000' : '/api'

export async function getLogs(query: LogsQuery = {}): Promise<LogsResponse> {
    const params = new URLSearchParams()
    params.set('page', String(query.page ?? 1))
    params.set('page_size', String(query.pageSize ?? 10000))

    if (query.service) {
        params.set('service', query.service)
    }

    if (query.reportType) {
        params.set('report_type', query.reportType)
    }

    if (query.fromTime) {
        params.set('from_time', query.fromTime)
    }

    if (query.toTime) {
        params.set('to_time', query.toTime)
    }

    const res = await fetch(`${API_BASE}/logs?${params.toString()}`)

    if (!res.ok) {
        throw new Error('Failed to fetch logs')
    }

    return res.json()
}