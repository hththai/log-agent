import { describe, expect, it } from 'vitest'
import { DEMO_SAMPLE_SERVICES, generateDemoLogsResponse } from './demoLog'

describe('generateDemoLogsResponse', () => {
    it('generates between 100 and 300 items with every sample service represented', () => {
        const result = generateDemoLogsResponse()

        expect(result.items.length).toBeGreaterThanOrEqual(100)
        expect(result.items.length).toBeLessThanOrEqual(300)

        const services = new Set(result.items.map((item) => item.name_service))
        for (const service of DEMO_SAMPLE_SERVICES) {
            expect(services.has(service)).toBe(true)
        }
    })

    it('populates every field on every item', () => {
        const result = generateDemoLogsResponse()

        for (const item of result.items) {
            expect(item.id).toBeTypeOf('number')
            expect(item.log_time).toBeTruthy()
            expect(item.level).toBeTruthy()
            expect(item.ip).toBeTruthy()
            expect(item.method).toBeTruthy()
            expect(item.path).toBeTruthy()
            expect(item.status).toBeTypeOf('number')
            expect(item.duration_ms).toBeTypeOf('number')
            expect(item.name_service).toBeTruthy()
        }
    })

    it('shapes the response envelope like the real LogsResponse', () => {
        const result = generateDemoLogsResponse()

        expect(result.table).toBe('demo')
        expect(result.page).toBe(1)
        expect(result.total).toBe(result.items.length)
        expect(result.page_size).toBe(result.items.length)
    })

    it('produces a freshly randomized dataset on each call', () => {
        const first = generateDemoLogsResponse()
        const second = generateDemoLogsResponse()

        expect(first).not.toEqual(second)
    })
})
