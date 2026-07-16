// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'

function AuthHarness() {
    const { user, isAuthenticated, loginWithSso, logout } = useAuth()

    return (
        <div>
            <button onClick={() => loginWithSso('demo@example.com')}>Log in</button>
            <button onClick={() => logout()}>Log out</button>
            <div data-testid="status">
                {isAuthenticated ? `signed-in:${user?.email}` : 'signed-out'}
            </div>
        </div>
    )
}

describe('AuthProvider', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it('persists and restores an authenticated session', () => {
        const { unmount } = render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        fireEvent.click(screen.getByRole('button', { name: /log in/i }))

        expect(screen.getByTestId('status').textContent).toBe('signed-in:demo@example.com')
        expect(localStorage.getItem('auth-session')).toContain('demo@example.com')

        unmount()

        render(
            <AuthProvider>
                <AuthHarness />
            </AuthProvider>,
        )

        expect(screen.getByTestId('status').textContent).toBe('signed-in:demo@example.com')
    })
})
