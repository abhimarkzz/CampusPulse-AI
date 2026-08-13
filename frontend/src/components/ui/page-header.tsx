import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('animate-slide-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-surface-600 dark:text-surface-400">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: string
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
}

const toneMap = {
  brand: 'from-brand-500/10 to-brand-600/5 text-brand-600 dark:text-brand-400',
  success: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600',
  warning: 'from-amber-500/10 to-amber-600/5 text-amber-600',
  danger: 'from-red-500/10 to-red-600/5 text-red-600',
  neutral: 'from-surface-500/10 to-surface-600/5 text-surface-600',
}

export function StatCard({ label, value, icon: Icon, trend, tone = 'brand', className }: StatCardProps) {
  return (
    <div className={cn('glass-panel group p-5 transition hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-surface-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend ? <p className="mt-1 text-xs text-surface-500">{trend}</p> : null}
        </div>
        <div className={cn('rounded-xl bg-gradient-to-br p-3', toneMap[tone])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
