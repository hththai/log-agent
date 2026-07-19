import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/components/Theme/ThemeProvider'

export function ThemeToggle({ className }: Readonly<{ className?: string }>) {
    const { theme, toggleTheme } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            className={`flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-offset-slate-950 ${className ?? ''}`}
            onClick={toggleTheme}
            type="button"
        >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
    )
}

export default ThemeToggle
