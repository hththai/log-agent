// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LogReportView } from './LogReportView'
import { ThemeProvider } from '@/components/Theme/ThemeProvider'
import type { LogItem, LogsResponse } from '@/api/log'

// cytoscape's canvas renderer isn't available in jsdom; LogNetworkGraph is out of
// scope for this filtering test, so stub the module it depends on.
vi.mock('cytoscape', () => ({
    default: () => ({
        on: vi.fn(),
        elements: () => ({ addClass: vi.fn(), removeClass: vi.fn() }),
        destroy: vi.fn(),
    }),
}))

// jsdom doesn't implement matchMedia; ThemeProvider (a LogNetworkGraph dependency
// via useTheme) reads it on mount, so stub it the same way ThemeProvider itself expects.
function stubMatchMedia() {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
}

// recharts renders no measurable SVG shapes under jsdom (no layout engine), so real
// slice clicks aren't reachable. Stub LogPie to expose the onSliceClick contract
// LogReportView actually wires up, which is what this test is verifying.
vi.mock('@/components/Log/LogPie', () => ({
    default: ({ onSliceClick }: { onSliceClick?: (service: string | null) => void }) => (
        <div>
            <button onClick={() => onSliceClick?.('ocr_api')} type="button">
                select-ocr_api
            </button>
            <button onClick={() => onSliceClick?.(null)} type="button">
                clear-selection
            </button>
        </div>
    ),
}))

function buildItem(overrides: Partial<LogItem>): LogItem {
    return {
        id: 1,
        log_time: new Date().toISOString(),
        level: 'INFO',
        ip: '10.0.0.1',
        method: 'GET',
        path: '/x',
        status: 200,
        duration_ms: 12.5,
        name_service: 'ocr_api',
        ...overrides,
    }
}

const fixture: LogsResponse = {
    table: 'demo',
    total: 5,
    page: 1,
    page_size: 5,
    items: [
        buildItem({ id: 1, name_service: 'ocr_api', ip: '10.0.0.1' }),
        buildItem({ id: 2, name_service: 'ocr_api', ip: '10.0.0.2' }),
        buildItem({ id: 3, name_service: 'ocr_client', ip: '10.0.0.3' }),
        buildItem({ id: 4, name_service: 'doc_invoice', ip: '10.0.0.4' }),
        buildItem({ id: 5, name_service: 'doc_invoice', ip: '10.0.0.5' }),
    ],
}

function totalRequestsValue() {
    const card = screen.getByText('Total Requests').closest('div')
    return within(card as HTMLElement).getByText(/^\d+$/).textContent
}

afterEach(() => {
    cleanup()
})

describe('LogReportView', () => {
    it('shows the unfiltered total across all sample services by default', () => {
        render(<LogReportView data={fixture} />)

        expect(totalRequestsValue()).toBe('5')
    })

    it('narrows the info-bar total and table rows to the selected service only', () => {
        render(<LogReportView data={fixture} />)

        fireEvent.click(screen.getByRole('button', { name: 'select-ocr_api' }))

        expect(totalRequestsValue()).toBe('2')
        // LogTable is the first <table> on the page (LogIpReport renders a second one).
        const table = within(screen.getAllByRole('table')[0])
        expect(table.getByText('10.0.0.1')).toBeTruthy()
        expect(table.getByText('10.0.0.2')).toBeTruthy()
        expect(table.queryByText('10.0.0.3')).toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'clear-selection' }))
        expect(totalRequestsValue()).toBe('5')
    })

    it('shows the Table & Chart group by default and hides the network diagram', () => {
        render(<LogReportView data={fixture} />)

        expect(screen.getByText('Total Requests')).toBeTruthy()
        expect(screen.queryByText('IP ↔ Service Network')).toBeNull()
    })

    it('switches to the network diagram and back when the switcher is clicked', () => {
        stubMatchMedia()
        render(
            <ThemeProvider>
                <LogReportView data={fixture} />
            </ThemeProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: /Network Diagram/i }))

        expect(screen.queryByText('Total Requests')).toBeNull()
        expect(screen.getByText('IP ↔ Service Network')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: /Table & Chart/i }))

        expect(screen.getByText('Total Requests')).toBeTruthy()
        expect(screen.queryByText('IP ↔ Service Network')).toBeNull()
    })
})
