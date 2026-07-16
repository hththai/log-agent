import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

export interface AuthUser {
    email: string
}

interface AuthContextValue {
    user: AuthUser | null
    isAuthenticated: boolean
    loginWithSso: (email: string) => void
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
    const [user, setUser] = useState<AuthUser | null>(() => getStoredSession())

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

    const loginWithSso = (email: string) => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail) {
            return
        }

        setUser({ email: trimmedEmail })
    }

    const logout = () => {
        setUser(null)
    }

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            loginWithSso,
            logout,
        }),
        [user],
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
