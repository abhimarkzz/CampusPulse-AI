import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Bot,
  LayoutDashboard,
  MessageSquareWarning,
  Settings,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const commands = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Complaints', to: '/complaints', icon: MessageSquareWarning },
  { label: 'Campus AI', to: '/campus-ai', icon: Bot },
  { label: 'Analytics', to: '/analytics', icon: Activity },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <Command
        className="glass-panel w-full max-w-xl overflow-hidden"
        label="Command palette"
      >
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search pages and actions…"
          className="w-full border-b bg-transparent px-4 py-4 text-base outline-none"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-8 text-center text-sm text-surface-500">
            No results found.
          </Command.Empty>
          <Command.Group heading="Navigation" className="px-2 py-2 text-xs uppercase tracking-wide text-surface-500">
            {commands.map((item) => (
              <Command.Item
                key={item.to}
                value={item.label}
                onSelect={() => {
                  navigate(item.to)
                  onOpenChange(false)
                  setSearch('')
                }}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-brand-50 dark:aria-selected:bg-brand-950"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
      <button
        type="button"
        aria-label="Close command palette"
        className="fixed inset-0 -z-10"
        onClick={() => onOpenChange(false)}
      />
    </div>
  )
}
