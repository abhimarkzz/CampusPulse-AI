import { NavLink, Link } from 'react-router-dom'
import {
  Activity,
  Bell,
  Bot,
  ChevronLeft,
  LayoutDashboard,
  Map,
  MessageSquareWarning,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useSidebarStore } from '@/stores'
import type { UserRole } from '@/types'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
  section?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, section: 'Main' },
  { label: 'Complaints', to: '/complaints', icon: MessageSquareWarning, section: 'Main' },
  { label: 'Campus AI', to: '/campus-ai', icon: Bot, section: 'Main' },
  { label: 'Analytics', to: '/analytics', icon: Activity, section: 'Insights', roles: ['staff', 'department_manager', 'administrator', 'super_administrator'] },
  { label: 'Campus Map', to: '/map', icon: Map, section: 'Insights' },
  { label: 'Notifications', to: '/notifications', icon: Bell, section: 'Account' },
  { label: 'Admin', to: '/admin', icon: Shield, section: 'Admin', roles: ['administrator', 'super_administrator'] },
  { label: 'Users', to: '/users', icon: Users, section: 'Admin', roles: ['administrator', 'super_administrator'] },
  { label: 'Settings', to: '/settings', icon: Settings, section: 'Account' },
]

function canAccess(role: UserRole, item: NavItem) {
  if (!item.roles) return true
  return item.roles.includes(role)
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebarStore()
  const items = navItems.filter((item) => user && canAccess(user.role, item))
  const sections = [...new Set(items.map((i) => i.section ?? 'Main'))]

  return (
    <>
      {mobileOpen ? (
        <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-surface-200/80 bg-white/95 shadow-xl backdrop-blur-2xl transition-all duration-300 dark:border-surface-800 dark:bg-surface-950/95 lg:translate-x-0',
          collapsed ? 'w-20 lg:w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="gradient-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-brand-500/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed ? (
              <div>
                <p className="font-display text-base font-bold tracking-tight">CampusPulse</p>
                <p className="text-[11px] font-medium text-brand-600 dark:text-brand-400">AI Intelligence</p>
              </div>
            ) : null}
          </Link>
          <button type="button" className="rounded-lg p-2 hover:bg-surface-100 lg:hidden dark:hover:bg-surface-800" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {!collapsed ? (
          <div className="border-b p-4">
            <Link to="/complaints/new">
              <Button className="w-full" size="sm">
                <Plus className="h-4 w-4" />
                New Complaint
              </Button>
            </Link>
          </div>
        ) : null}

        <nav className="flex-1 overflow-y-auto p-3">
          {sections.map((section) => (
            <div key={section} className="mb-4">
              {!collapsed ? (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-surface-400">{section}</p>
              ) : null}
              <div className="space-y-1">
                {items.filter((i) => (i.section ?? 'Main') === section).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        isActive ? 'nav-active' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800/80',
                        collapsed && 'justify-center px-2',
                      )
                    }
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && user ? (
          <div className="border-t p-4">
            <div className="rounded-xl bg-surface-50 p-3 dark:bg-surface-900">
              <p className="truncate text-sm font-semibold">{user.full_name}</p>
              <p className="truncate text-xs capitalize text-surface-500">{user.role.replaceAll('_', ' ')}</p>
            </div>
          </div>
        ) : null}

        <div className="hidden border-t p-3 lg:block">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex w-full items-center justify-center rounded-xl border p-2.5 text-surface-500 transition hover:bg-surface-100 dark:hover:bg-surface-800"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>
      </aside>
    </>
  )
}
