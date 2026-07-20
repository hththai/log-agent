// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Home } from './index'
import { useAuth } from '#/auth/AuthProvider'

vi.mock('#/auth/AuthProvider', () => ({
    useAuth: vi.fn(),
}))

vi.mock('@tanstack/react-router', async () => {
    const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
    return {
        ...actual,
        useRouter: () => ({ navigate: vi.fn() }),
    }
})

// LogReport's query never resolves here, so it stays in its "Loading..." state
// and never reaches the cytoscape-backed LogNetworkGraph — out of scope for this test.
vi.mock('#/api/log', async () => {
    const actual = await vi.importActual<typeof import('#/api/log')>('#/api/log')
    return {
        ...actual,
        getLogs: vi.fn(() => new Promise(() => {})),
    }
})

const mockedUseAuth = vi.mocked(useAuth)

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

describe('/ landing route', () => {
    it('shows a public landing view with a demo link instead of redirecting when unauthenticated', () => {
        mockedUseAuth.mockReturnValue({
            isAuthenticated: false,
            user: null,
            loginError: null,
            loginWithSso: vi.fn(),
            logout: vi.fn(),
        })

        render(<Home />)

        const demoLink = screen.getByRole('link', { name: /view demo dashboard/i })
        expect(demoLink.getAttribute('href')).toBe('/demo')
        const signInLink = screen.getByRole('link', { name: /sign in/i })
        expect(signInLink.getAttribute('href')).toBe('/login')
    })

    it('renders the authenticated dashboard experience instead of the public landing page when signed in with a role', () => {
        mockedUseAuth.mockReturnValue({
            isAuthenticated: true,
            user: { email: 'admin@example.com', role: 'admin' },
            loginError: null,
            loginWithSso: vi.fn(),
            logout: vi.fn(),
        })

        render(<Home />)

        // getLogs never resolves in this test, so LogReport stays in its "Loading..." state.
        expect(screen.getByText('Loading...')).toBeTruthy()
        expect(screen.queryByRole('link', { name: /view demo dashboard/i })).toBeNull()
    })
})
