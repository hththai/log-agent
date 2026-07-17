// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'
import { login } from '#/api/sso'

vi.mock('#/api/sso', () => ({
    login: vi.fn(),
}))

const mockedLogin = vi.mocked(login)

function AuthHarness() {
    const { user, isAuthenticated, loginError, loginWithSso, logout } = useAuth()

    return (
        <div>
            <button onClick={() => loginWithSso('demo@example.com')}>Log in</button>
            <button onClick={() => logout()}>Log out</button>
            <div data-testid="status">
                {isAuthenticated ? `signed-in:${user?.email}:${user?.role ?? ''}` : 'signed-out'}
            </div>
            <div data-testid="error">{loginError ?? ''}</div>
        </div>
    )
}

describe('AuthProvider', () => {
    beforeEach(() => {
        localStorage.clear()
        mockedLogin.mockReset()
    })

    afterEach(() => {
        cleanup()
    })

    it('persists and restores an authenticated session', async () => {
        mockedLogin.mockResolvedValue({ granted: true, role: 'admin', email: 'demo@example.com' })

        const { unmount } = render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => {
            expect(screen.getByTestId('status').textContent).toBe('signed-in:demo@example.com:admin')
        })
        expect(localStorage.getItem('auth-session')).toContain('demo@example.com')

        unmount()

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        expect(screen.getByTestId('status').textContent).toBe('signed-in:demo@example.com:admin')
    })

    it('stays signed out and surfaces the denial reason when access is denied', async () => {
        mockedLogin.mockResolvedValue({ granted: false, reason: 'No access mapping matched this identity' })

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => {
            expect(screen.getByTestId('error').textContent).toBe('No access mapping matched this identity')
        })
        expect(screen.getByTestId('status').textContent).toBe('signed-out')
        expect(localStorage.getItem('auth-session')).toBeNull()
    })

    it('surfaces a generic error when the sign-in request itself fails', async () => {
        mockedLogin.mockRejectedValue(new Error('Network unreachable'))

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        await waitFor(() => {
            expect(screen.getByTestId('error').textContent).toBe('Network unreachable')
        })
        expect(screen.getByTestId('status').textContent).toBe('signed-out')
    })
})
