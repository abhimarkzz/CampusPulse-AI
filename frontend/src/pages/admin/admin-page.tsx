import { useQuery } from '@tanstack/react-query'
import { Shield, Users, Activity, AlertTriangle } from 'lucide-react'
import { PageHeader, StatCard } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/services/api/client'

export default function AdminPage() {
  const { data: overview } = useQuery({ queryKey: ['admin-overview'], queryFn: () => api.admin.overview() })
  const { data: live } = useQuery({ queryKey: ['admin-live'], queryFn: () => api.admin.liveComplaints() })
  const { data: audit } = useQuery({ queryKey: ['admin-audit'], queryFn: () => api.admin.auditLogs() })

  const o = overview?.data ?? {}

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operations" title="Admin Command Center" description="Live campus operations, SLA monitoring, and audit visibility." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open complaints" value={(o.open_complaints as number) ?? 0} icon={Activity} tone="brand" />
        <StatCard label="SLA at risk" value={(o.sla_at_risk as number) ?? 0} icon={AlertTriangle} tone="warning" />
        <StatCard label="Total users" value={(o.total_users as number) ?? 0} icon={Users} tone="neutral" />
        <StatCard label="Active clusters" value={(o.active_clusters as number) ?? 0} icon={Shield} tone="brand" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Live complaint queue" description="Most recent campus issues">
          <div className="space-y-2">
            {(live?.data ?? []).map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border p-3 text-sm transition hover:bg-surface-50 dark:hover:bg-surface-900">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-surface-500">{c.ticket_number}</p>
                </div>
                <Badge tone="brand">{c.status.replaceAll('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Audit trail" description="Security and operational logs">
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {(audit?.data ?? []).map((a) => (
              <div key={a.id as string} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{a.action as string}</p>
                <p className="text-xs text-surface-500">{a.resource_type as string} · {new Date(a.created_at as string).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
