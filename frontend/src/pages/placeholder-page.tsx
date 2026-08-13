import type { ReactNode } from 'react'

interface PlaceholderPageProps {
  title: string
  description: string
  children?: ReactNode
}

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-surface-600 dark:text-surface-400">
          {description}
        </p>
      </div>
      <div className="glass-panel p-8 text-sm text-surface-600 dark:text-surface-400">
        {children ?? 'This module will be connected to the backend in the next implementation phase.'}
      </div>
    </div>
  )
}
