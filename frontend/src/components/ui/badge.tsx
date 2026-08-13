import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const toneStyles = {
  default: 'bg-surface-100 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200',
  danger: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
} as const

interface BadgeProps {
  children: ReactNode
  tone?: keyof typeof toneStyles
  className?: string
}

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
