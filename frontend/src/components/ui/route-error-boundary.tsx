import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Something went wrong loading this page.'

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-950/40 dark:text-danger-400">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="font-display text-xl font-bold">Page error</h1>
        <p className="text-sm text-surface-500">{message}</p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>Reload</Button>
        <Link to="/dashboard" className="inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
