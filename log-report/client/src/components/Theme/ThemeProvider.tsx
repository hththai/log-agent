import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
    theme: Theme
    toggleTheme: () => void
    setTheme: (theme: Theme) => void
}

const STORAGE_KEY = 'theme-preference'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getStoredTheme(): Theme {
    if (typeof window === 'undefined') {
        return 'light'
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') {
        return stored
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        window.localStorage.setItem(STORAGE_KEY, theme)
        document.documentElement.classList.toggle('dark', theme === 'dark')
        document.documentElement.dataset.theme = theme
    }, [theme])

    const toggleTheme = () => {
        setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
    }

    const updateTheme = (nextTheme: Theme) => {
        setTheme(nextTheme)
    }

    const value = useMemo<ThemeContextValue>(
        () => ({ theme, toggleTheme, setTheme: updateTheme }),
        [theme],
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)

    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }

    return context
}
