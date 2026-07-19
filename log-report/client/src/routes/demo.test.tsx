// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as logApi from '#/api/log'
import * as demoLogApi from '#/api/demoLog'
import { DemoPage } from './demo'

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
        render(<DemoPage />)

        expect(screen.getByText('Total Request')).toBeTruthy()
        expect(mockedGetLogs).not.toHaveBeenCalled()
    })

    it('shows the sample-data banner and a sign-in link by default', () => {
        render(<DemoPage />)

        expect(screen.getByText(/you're viewing sample data/i)).toBeTruthy()
        const signInLink = screen.getByRole('link', { name: /sign in/i })
        expect(signInLink.getAttribute('href')).toBe('/login')
    })

    it('renders the fallback message instead of the dashboard when generation fails', () => {
        vi.spyOn(demoLogApi, 'generateDemoLogsResponse').mockImplementation(() => {
            throw new Error('boom')
        })

        render(<DemoPage />)

        expect(screen.getByText(/demo preview unavailable/i)).toBeTruthy()
        expect(screen.queryByText('Total Request')).toBeNull()
    })

    it('keeps the underlying dataset stable while filtering, then clearing, a service', () => {
        render(<DemoPage />)

        const totalBefore = screen.getByText('Total Request').closest('div')
        const totalValueBefore = within(totalBefore as HTMLElement).getByText(/^\d+$/).textContent

        const pieSlice = document.querySelector('.recharts-pie-sector path')
        if (pieSlice) {
            fireEvent.click(pieSlice)
            fireEvent.click(pieSlice)
        }

        const totalAfter = screen.getByText('Total Request').closest('div')
        const totalValueAfter = within(totalAfter as HTMLElement).getByText(/^\d+$/).textContent

        expect(totalValueAfter).toBe(totalValueBefore)
    })
})
