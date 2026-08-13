import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ApiErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ApiErrorState({
  title = 'Unable to load data',
  message = 'The backend API is not responding. Make sure PostgreSQL and the backend server are running, then re-seed the database.',
  onRetry,
}: ApiErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" padding="lg">
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 rounded-2xl bg-red-100 p-4 dark:bg-red-950">
          <ServerCrash className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="font-display text-lg font-semibold text-red-800 dark:text-red-200">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-red-700/80 dark:text-red-300/80">{message}</p>
        <div className="mt-6 rounded-xl bg-white/80 p-4 text-left text-xs text-surface-600 dark:bg-surface-900 dark:text-surface-400">
          <p className="flex items-center gap-2 font-semibold"><AlertCircle className="h-4 w-4" />Quick fix — run in terminal:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-100 p-3 text-[11px] dark:bg-surface-800">{`docker compose up -d postgres redis
cd backend && source .venv/bin/activate
alembic upgrade head
python -m app.database.seed
uvicorn app.main:app --reload`}</pre>
        </div>
        {onRetry ? (
          <Button className="mt-6" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />Try again
          </Button>
        ) : null}
      </div>
    </Card>
  )
}

export function BackendStatusBanner({ ok, message }: { ok: boolean; message?: string }) {
  if (ok) return null
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{message ?? 'Backend offline — start the API server on port 8000 to see live data.'}</p>
    </div>
  )
}
