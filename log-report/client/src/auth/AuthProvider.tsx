import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import { getSession, login as loginRequest, logout as logoutRequest } from '#/api/sso'

export interface AuthUser {
    email: string
    role?: string
}

export interface LoginOutcome {
    granted: boolean
    reason?: string
}

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    loginError: string | null
    loginWithSso: (email: string) => Promise<LoginOutcome>
    logout: () => void
}

const STORAGE_KEY = 'auth-session'

const AuthContext = createContext<AuthContextValue | null>(null)

function getStoredSession(): AuthUser | null {
    if (typeof window === 'undefined') {
        return null
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
        return null
    }

    try {
        const parsed = JSON.parse(raw) as { user?: AuthUser }
        return parsed.user ?? null
    } catch {
        return null
    }
}

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    // localStorage seeds the initial render only (paint-avoidance hint) — the
    // server-verified session cookie, checked below via getSession(), is the
    // actual source of truth for whether the user is signed in.
    const [user, setUser] = useState<AuthUser | null>(() => getStoredSession())
    const [loginError, setLoginError] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        if (user) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }))
        } else {
            window.localStorage.removeItem(STORAGE_KEY)
        }
    }, [user])

    useEffect(() => {
        let cancelled = false

        getSession()
            .then((result) => {
                if (cancelled) {
                    return
                }
                setUser(result.granted ? { email: result.email ?? '', role: result.role } : null)
            })
            .catch(() => {
                // Session check failed (e.g. offline) — keep the localStorage hint as-is.
            })

        return () => {
            cancelled = true
        }
    }, [])

    const loginWithSso = async (email: string): Promise<LoginOutcome> => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            const reason = 'Please enter your email address.'
            setLoginError(reason)
            return { granted: false, reason }
        }

        try {
            const result = await loginRequest(trimmedEmail)
            if (!result.granted) {
                const reason = result.reason ?? 'Access denied for this identity.'
                setUser(null)
                setLoginError(reason)
                return { granted: false, reason }
            }

            setUser({ email: result.email ?? trimmedEmail, role: result.role })
            setLoginError(null)
            return { granted: true }
        } catch (err) {
            const reason = err instanceof Error ? err.message : 'Sign-in failed.'
            setUser(null)
            setLoginError(reason)
            return { granted: false, reason }
        }
    }

    const logout = () => {
        setUser(null)
        setLoginError(null)
        logoutRequest().catch(() => {
            // Best-effort: local state is already cleared regardless of network failure.
        })
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            loginError,
            loginWithSso,
            logout,
        }),
        [user, loginError],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }

    return context
}
