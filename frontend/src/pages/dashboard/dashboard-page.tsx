import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  MessageSquareWarning,
  Sparkles,
} from 'lucide-react'
import { PageHeader, StatCard } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonCard, LoadingState } from '@/components/ui/empty-state'
import { ApiErrorState, BackendStatusBanner } from '@/components/ui/api-error-state'
import { api } from '@/services/api/client'
import { formatRelativeTime } from '@/lib/utils'
import type { ComplaintPriority } from '@/types'

const priorityTone: Record<ComplaintPriority, 'default' | 'brand' | 'warning' | 'danger'> = {
  LOW: 'default', MEDIUM: 'brand', HIGH: 'warning', CRITICAL: 'danger',
}

export default function DashboardPage() {
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: () => api.health(), retry: 1 })
  const { data, isLoading: statsLoading, isError: statsError, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.analytics.dashboard(),
    retry: 1,
  })
  const { data: complaints, isLoading: complaintsLoading, isError: complaintsError } = useQuery({
    queryKey: ['complaints-recent'],
    queryFn: () => api.complaints.list({ page: 1, page_size: 5 }),
    retry: 1,
  })
  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.analytics.insights(),
    retry: 1,
  })

  const stats = data?.data
  const backendOk = health?.status === 'ok'

  if (statsLoading && complaintsLoading) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Overview" title="Dashboard" description="Loading campus data…" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        <LoadingState message="Connecting to backend…" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BackendStatusBanner ok={backendOk} />

      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Real-time campus service intelligence and complaint tracking at KLH University Aziz Nagar."
        action={
          <Link to="/complaints/new">
            <Button><Sparkles className="h-4 w-4" />Report Issue</Button>
          </Link>
        }
      />

      {statsError ? (
        <ApiErrorState title="Dashboard data unavailable" onRetry={() => refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open complaints" value={stats?.open_complaints ?? 0} icon={MessageSquareWarning} tone="brand" />
          <StatCard label="Resolved today" value={stats?.resolved_today ?? 0} icon={CheckCircle2} tone="success" />
          <StatCard label="SLA at risk" value={stats?.sla_at_risk ?? 0} icon={AlertTriangle} tone="warning" />
          <StatCard label="Campus health" value={`${stats?.campus_health_score ?? 0}%`} icon={Activity} tone="brand" />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Recent complaints" description="Latest activity across KLH campus" action={<Link to="/complaints" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>}>
          {complaintsError ? <p className="py-6 text-center text-sm text-surface-500">Could not load complaints — is the backend running?</p> : null}
          {complaintsLoading ? <LoadingState message="Loading complaints…" /> : null}
          {!complaintsLoading && !complaintsError && (complaints?.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-surface-500">No complaints yet. Run <code className="rounded bg-surface-100 px-1">python -m app.database.seed</code> to load demo data.</p>
          ) : null}
          <div className="space-y-3">
            {(complaints?.data ?? []).map((c) => (
              <Link key={c.id} to={`/complaints/${c.id}`} className="group flex items-center justify-between gap-4 rounded-xl border border-transparent p-4 transition hover:border-brand-200 hover:bg-brand-50/50 dark:hover:border-brand-900 dark:hover:bg-brand-950/30">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold group-hover:text-brand-700">{c.title}</p>
                    <Badge tone={priorityTone[c.priority]}>{c.priority}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-surface-500">{c.ticket_number} · {formatRelativeTime(c.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="brand">{c.status.replaceAll('_', ' ')}</Badge>
                  <ArrowUpRight className="h-4 w-4 text-surface-400 opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="AI insights" description="Emerging patterns on campus">
          <div className="space-y-3">
            {(insights?.data ?? []).map((insight) => (
              <div key={insight.id as string} className="rounded-xl border p-4">
                <p className="text-sm font-semibold">{insight.title as string}</p>
                <p className="mt-1 text-xs leading-relaxed text-surface-500">{insight.evidence as string}</p>
              </div>
            ))}
            {(insights?.data ?? []).length === 0 ? (
              <p className="text-sm text-surface-500">No insights yet — seed the database to populate.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
