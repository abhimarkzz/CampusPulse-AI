import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-semibold text-surface-700 dark:text-surface-200">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'flex h-12 w-full rounded-xl border border-surface-200 bg-white px-4 text-sm shadow-sm transition placeholder:text-surface-400 focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-900',
          error && 'border-red-400 focus-visible:ring-red-500/10',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-surface-500">{hint}</p> : null}
    </div>
  ),
)
Input.displayName = 'Input'
