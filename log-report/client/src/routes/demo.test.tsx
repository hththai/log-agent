// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as logApi from '#/api/log'
import * as demoLogApi from '#/api/demoLog'
import { DemoPage } from './demo'
import { ThemeProvider } from '#/components/Theme/ThemeProvider'

// jsdom doesn't implement matchMedia; ThemeProvider (a LogPie/LogNetworkGraph
// dependency via useTheme) reads it on mount, so stub it the same way ThemeProvider
// itself expects.
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

function renderDemoPage() {
    stubMatchMedia()
    return render(
        <ThemeProvider>
            <DemoPage />
        </ThemeProvider>,
    )
}

// cytoscape's canvas renderer isn't available in jsdom; LogNetworkGraph is out of
// scope for these route-level tests, so stub the module it depends on.
vi.mock('cytoscape', () => ({
    default: () => ({
        on: vi.fn(),
        elements: () => ({ addClass: vi.fn(), removeClass: vi.fn() }),
        destroy: vi.fn(),
    }),
}))

vi.mock('#/api/log', async () => {
    const actual = await vi.importActual<typeof import('#/api/log')>('#/api/log')
    return {
        ...actual,
        getLogs: vi.fn(),
    }
})

const mockedGetLogs = vi.mocked(logApi.getLogs)

afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})

describe('DemoPage', () => {
    it('renders dashboard content without ever calling the real /logs API', () => {
        renderDemoPage()

        expect(screen.getByText('Total Requests')).toBeTruthy()
        expect(mockedGetLogs).not.toHaveBeenCalled()
    })

    it('shows the sample-data banner and a sign-in link by default', () => {
        renderDemoPage()

        expect(screen.getByText(/you're viewing sample data/i)).toBeTruthy()
        const signInLink = screen.getByRole('link', { name: /sign in/i })
        expect(signInLink.getAttribute('href')).toBe('/login')
    })

    it('renders the fallback message instead of the dashboard when generation fails', () => {
        vi.spyOn(demoLogApi, 'generateDemoLogsResponse').mockImplementation(() => {
            throw new Error('boom')
        })

        renderDemoPage()

        expect(screen.getByText(/demo preview unavailable/i)).toBeTruthy()
        expect(screen.queryByText('Total Requests')).toBeNull()
    })

    it('keeps the underlying dataset stable while filtering, then clearing, a service', () => {
        renderDemoPage()

        const totalBefore = screen.getByText('Total Requests').closest('div')
        const totalValueBefore = within(totalBefore as HTMLElement).getByText(/^\d+$/).textContent

        const pieSlice = document.querySelector('.recharts-pie-sector path')
        if (pieSlice) {
            fireEvent.click(pieSlice)
            fireEvent.click(pieSlice)
        }

        const totalAfter = screen.getByText('Total Requests').closest('div')
        const totalValueAfter = within(totalAfter as HTMLElement).getByText(/^\d+$/).textContent

        expect(totalValueAfter).toBe(totalValueBefore)
    })
})
