import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Menu, Plus, Search } from 'lucide-react'
import { useAuthStore, useSidebarStore } from '@/stores'
import { ThemeToggle } from '@/components/layout/theme-provider'
import { Button } from '@/components/ui/button'
import { api } from '@/services/api/client'

interface AppHeaderProps {
  onOpenCommand: () => void
}

export function AppHeader({ onOpenCommand }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user)
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  const { data: notifications } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => api.notifications.list(true),
    refetchInterval: 30000,
  })
  const unreadCount = notifications?.data?.length ?? 0

  return (
    <header className="sticky top-0 z-30 border-b border-surface-200/80 bg-white/80 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-950/80">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex flex-1 items-center gap-3">
          <button type="button" className="rounded-xl border p-2.5 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden max-w-md flex-1 items-center gap-3 rounded-xl border bg-surface-50/80 px-4 py-2.5 text-left text-sm text-surface-500 transition hover:border-brand-300 hover:bg-white md:flex dark:bg-surface-900/50 dark:hover:bg-surface-900"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">Search complaints, pages…</span>
            <kbd className="hidden rounded-md border bg-white px-2 py-0.5 text-[10px] font-medium lg:inline dark:bg-surface-800">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/complaints/new" className="hidden sm:block">
            <Button size="sm"><Plus className="h-4 w-4" />New</Button>
          </Link>
          <Link to="/notifications" className="relative rounded-xl border p-2.5 transition hover:bg-surface-100 dark:hover:bg-surface-800">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
          </Link>
          <ThemeToggle />
          {user ? (
            <Link to="/settings" className="flex items-center gap-2.5 rounded-xl border py-1.5 pr-3 pl-1.5 transition hover:bg-surface-50 dark:hover:bg-surface-900">
              <div className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold text-white">
                {user.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user.full_name.split(' ')[0]}</p>
                <p className="mt-0.5 text-[11px] capitalize text-surface-500">{user.role.replaceAll('_', ' ')}</p>
              </div>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
