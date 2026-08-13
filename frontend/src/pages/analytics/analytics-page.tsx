import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader, StatCard } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/empty-state'
import { Activity, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { api } from '@/services/api/client'

export default function AnalyticsPage() {
  const { data: dashboard, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.analytics.dashboard() })
  const { data: trends } = useQuery({ queryKey: ['trends'], queryFn: () => api.analytics.trends() })
  const { data: insights } = useQuery({ queryKey: ['insights'], queryFn: () => api.analytics.insights() })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Intelligence" title="Analytics" description="Campus service trends, SLA performance, and AI-generated operational insights." />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open" value={dashboard?.data.open_complaints ?? 0} icon={Activity} tone="brand" />
          <StatCard label="Resolved today" value={dashboard?.data.resolved_today ?? 0} icon={CheckCircle2} tone="success" />
          <StatCard label="SLA at risk" value={dashboard?.data.sla_at_risk ?? 0} icon={AlertTriangle} tone="warning" />
          <StatCard label="Health score" value={`${dashboard?.data.campus_health_score ?? 0}%`} icon={Sparkles} tone="brand" />
        </div>
      )}

      <Card title="Complaints by category" description="Distribution across service categories">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends?.data ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#2552eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="AI insights" description="Automated pattern detection">
        <div className="grid gap-4 md:grid-cols-2">
          {(insights?.data ?? []).map((item) => (
            <div key={item.id as string} className="rounded-xl border p-5 transition hover:border-brand-200 hover:shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-950"><Sparkles className="h-4 w-4 text-brand-600" /></div>
                <div>
                  <p className="font-semibold">{item.title as string}</p>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500">{item.evidence as string}</p>
                  {item.recommended_action ? <p className="mt-2 text-xs font-medium text-brand-600">{item.recommended_action as string}</p> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
