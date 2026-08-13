import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { CommandPalette } from '@/components/layout/command-palette'
import { useSidebarStore } from '@/stores'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [commandOpen, setCommandOpen] = useState(false)
  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <div className="gradient-mesh min-h-screen">
      <Sidebar />
      <div className={cn('min-h-screen transition-all duration-300', collapsed ? 'lg:pl-20' : 'lg:pl-72')}>
        <AppHeader onOpenCommand={() => setCommandOpen(true)} />
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}
