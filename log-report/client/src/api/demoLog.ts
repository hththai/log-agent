import { faker } from '@faker-js/faker'
import type { LogItem, LogsResponse } from '@/api/log'

export const DEMO_SAMPLE_SERVICES = ['ocr_api', 'ocr_client', 'doc_invoice'] as const

const LOG_LEVELS = ['INFO', 'WARN', 'ERROR'] as const
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const
const STATUS_WEIGHTS = [
    { weight: 6, value: 200 },
    { weight: 2, value: 201 },
    { weight: 2, value: 204 },
    { weight: 2, value: 400 },
    { weight: 1, value: 401 },
    { weight: 2, value: 404 },
    { weight: 1, value: 500 },
    { weight: 1, value: 503 },
]

function randomIp(): string {
    return faker.helpers.arrayElement([
        () => faker.internet.ipv4({ network: 'private-a' }),
        () => faker.internet.ipv4({ network: 'private-c' }),
        () => faker.internet.ipv4(),
    ])()
}

function buildDemoLogItem(id: number, service: string): LogItem {
    return {
        id,
        log_time: faker.date.recent({ days: 7 }).toISOString(),
        level: faker.helpers.arrayElement(LOG_LEVELS),
        ip: randomIp(),
        method: faker.helpers.arrayElement(HTTP_METHODS),
        path: faker.system.filePath(),
        status: faker.helpers.weightedArrayElement(STATUS_WEIGHTS),
        duration_ms: faker.number.float({ min: 1, max: 4000, fractionDigits: 2 }),
        name_service: service,
    }
}

export function generateDemoLogsResponse(): LogsResponse {
    const total = faker.number.int({ min: 100, max: 300 })

    // Guarantee every sample service has at least one row before filling the rest randomly.
    const items: LogItem[] = DEMO_SAMPLE_SERVICES.map((service, index) => buildDemoLogItem(index + 1, service))

    for (let id = items.length + 1; id <= total; id++) {
        items.push(buildDemoLogItem(id, faker.helpers.arrayElement(DEMO_SAMPLE_SERVICES)))
    }

    return {
        table: 'demo',
        total: items.length,
        page: 1,
        page_size: items.length,
        items,
    }
}
