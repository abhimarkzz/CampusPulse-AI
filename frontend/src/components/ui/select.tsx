import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-surface-700 dark:text-surface-200">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={id}
        className={cn(
          'flex h-11 w-full rounded-xl border bg-white px-4 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-surface-900',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  ),
)
Select.displayName = 'Select'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className, label, error, id, ...props }, ref) => (
  <div className="space-y-2">
    {label ? (
      <label htmlFor={id} className="text-sm font-medium text-surface-700 dark:text-surface-200">
        {label}
      </label>
    ) : null}
    <textarea
      ref={ref}
      id={id}
      className={cn(
        'min-h-32 w-full rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-surface-900',
        error && 'border-red-500',
        className,
      )}
      {...props}
    />
    {error ? <p className="text-sm text-red-500">{error}</p> : null}
  </div>
))
Textarea.displayName = 'Textarea'
