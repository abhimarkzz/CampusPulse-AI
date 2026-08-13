import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, MessageSquareWarning } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState, LoadingState } from '@/components/ui/empty-state'
import { api } from '@/services/api/client'
import { formatRelativeTime } from '@/lib/utils'
import type { ComplaintPriority, ComplaintStatus } from '@/types'

const priorityTone: Record<ComplaintPriority, 'default' | 'brand' | 'warning' | 'danger'> = {
  LOW: 'default', MEDIUM: 'brand', HIGH: 'warning', CRITICAL: 'danger',
}

export default function ComplaintsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['complaints', search, status],
    queryFn: () => api.complaints.list({ search, status, page: 1, page_size: 50 }),
  })

  const complaints = data?.data ?? []
  const total = data?.meta?.total as number | undefined

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Service Desk"
        title="Complaints"
        description={`Track, filter, and manage campus service issues. ${total != null ? `${total} total.` : ''}`}
        action={
          <Link to="/complaints/new">
            <Button><Plus className="h-4 w-4" />New complaint</Button>
          </Link>
        }
      />

      <Card padding="md">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-3.5 left-3.5 h-4 w-4 text-surface-400" />
            <Input className="pl-10" placeholder="Search by title or description…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select className="sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {(['PENDING', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED', 'CLOSED'] as ComplaintStatus[]).map((s) => (
              <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
            ))}
          </Select>
        </div>
      </Card>

      {isLoading ? <LoadingState message="Loading complaints…" /> : null}

      {!isLoading && complaints.length === 0 ? (
        <EmptyState
          icon={MessageSquareWarning}
          title="No complaints found"
          description="Try adjusting your filters or create a new complaint to report a campus issue."
          action={<Link to="/complaints/new"><Button><Plus className="h-4 w-4" />Create complaint</Button></Link>}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {complaints.map((c) => (
          <Link key={c.id} to={`/complaints/${c.id}`}>
            <Card className="group h-full transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{c.ticket_number}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{c.title}</h3>
                  <p className="mt-2 text-sm text-surface-500">{formatRelativeTime(c.created_at)}</p>
                </div>
                <Badge tone={priorityTone[c.priority]}>{c.priority}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <Badge tone="brand">{c.status.replaceAll('_', ' ')}</Badge>
                <span className="text-xs font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">View details →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
