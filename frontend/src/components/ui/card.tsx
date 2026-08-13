import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function Card({
  children,
  className,
  title,
  description,
  action,
  padding = 'md',
}: CardProps) {
  return (
    <section className={cn('glass-panel overflow-hidden', paddingMap[padding], className)}>
      {(title || description || action) && (
        <header className={cn('flex items-start justify-between gap-4', padding !== 'none' && 'mb-5')}>
          <div>
            {title ? <h3 className="font-display text-lg font-semibold">{title}</h3> : null}
            {description ? (
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">{description}</p>
            ) : null}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
