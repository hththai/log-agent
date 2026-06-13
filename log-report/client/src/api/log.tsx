export interface LogItem {
    id: number;
    log_time: string;
    level: string;
    ip: string;
    method: string;
    path: string;
    status: number;
    duration_ms: number;
    name_service: string;
}

export interface LogsResponse {
    table: string;
    total: number;
    page: number;
    page_size: number;
    items: LogItem[];
}

export async function getLogs(): Promise<LogsResponse> {
    const res = await fetch(`http://localhost:8000/logs`)

    if (!res.ok) throw new Error("Failed to fetch logs")

    const data = await res.json();
    return data
}