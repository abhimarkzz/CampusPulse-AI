import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut, Moon, Sun, Monitor, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { useAuthStore, useThemeStore } from '@/stores'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ApiErrorState } from '@/components/ui/api-error-state'
import { api } from '@/services/api/client'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { theme, setTheme } = useThemeStore()
  const navigate = useNavigate()

  const { data: health, isError, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    retry: 1,
    refetchInterval: 15000,
  })

  const backendOk = health?.status === 'ok'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader eyebrow="Account" title="Settings" description="Profile, preferences, and system connection status." />

      <Card title="Profile">
        <div className="flex items-center gap-4">
          <div className="gradient-brand flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-bold text-white">
            {user?.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{user?.full_name}</p>
            <p className="text-sm text-surface-500">{user?.email}</p>
            <p className="mt-1 text-xs capitalize text-brand-600">{user?.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </Card>

      <Card title="System connection">
        <div className="flex items-center gap-3">
          {backendOk ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Backend connected</p>
                <p className="text-sm text-surface-500">API server is running on port 8000</p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">Backend offline</p>
                <p className="text-sm text-surface-500">Start the backend to load dashboard, map, and AI data</p>
              </div>
            </>
          )}
        </div>
        {isError ? <div className="mt-4"><ApiErrorState title="Cannot reach backend" onRetry={() => refetch()} /></div> : null}
      </Card>

      <Card title="Appearance">
        <p className="mb-4 text-sm text-surface-500">Choose your preferred color theme.</p>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition ${theme === t ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'hover:bg-surface-50 dark:hover:bg-surface-900'}`}
            >
              {t === 'dark' ? <Moon className="h-4 w-4" /> : t === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Account actions">
        <Button variant="danger" onClick={() => { clearAuth(); navigate('/login') }}>
          <LogOut className="h-4 w-4" />Sign out
        </Button>
      </Card>
    </div>
  )
}
