import { useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useThemeStore } from '@/stores'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media.matches))
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  return <>{children}</>
}

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore()
  const cycle = () => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <button
      type="button"
      onClick={cycle}
      className="rounded-xl border p-2.5 transition hover:bg-surface-100 dark:hover:bg-surface-800"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}
