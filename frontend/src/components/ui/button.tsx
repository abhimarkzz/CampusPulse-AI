import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'gradient-brand text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 hover:brightness-105',
  secondary: 'bg-surface-100 text-surface-900 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700',
  ghost: 'bg-transparent hover:bg-surface-100 dark:hover:bg-surface-800',
  outline: 'border-2 border-surface-200 bg-transparent hover:border-brand-300 hover:bg-brand-50/50 dark:border-surface-700 dark:hover:bg-surface-900',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20',
} as const

const sizes = {
  sm: 'h-9 px-3.5 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  ),
)
Button.displayName = 'Button'
