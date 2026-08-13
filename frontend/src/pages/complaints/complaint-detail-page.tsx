import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Clock,
  MapPin,
  MessageSquare,
  Sparkles,
  ThumbsUp,
  User,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/empty-state'
import { api } from '@/services/api/client'
import { formatRelativeTime } from '@/lib/utils'
import { useAuthStore } from '@/stores'
import type { ComplaintPriority } from '@/types'

const priorityTone: Record<ComplaintPriority, 'default' | 'brand' | 'warning' | 'danger'> = {
  LOW: 'default', MEDIUM: 'brand', HIGH: 'warning', CRITICAL: 'danger',
}

export default function ComplaintDetailPage() {
  const { id = '' } = useParams()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['complaint', id], queryFn: () => api.complaints.get(id), enabled: Boolean(id) })
  const { data: similar } = useQuery({ queryKey: ['similar', id], queryFn: () => api.complaints.similar(id), enabled: Boolean(id) })

  const upvote = useMutation({
    mutationFn: () => api.complaints.upvote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaint', id] }),
  })
  const advance = useMutation({
    mutationFn: (status: string) => api.complaints.updateStatus(id, status as never),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['complaint', id] }); toast.success('Status updated') },
  })

  if (isLoading || !data?.data) return <LoadingState message="Loading complaint details…" />
  const c = data.data
  const isStaff = user && ['staff', 'department_manager', 'administrator', 'super_administrator'].includes(user.role)

  return (
    <div className="space-y-8">
      <Link to="/complaints" className="inline-flex items-center gap-2 text-sm font-medium text-surface-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" />Back to complaints
      </Link>

      <PageHeader
        eyebrow={c.ticket_number as string}
        title={c.title as string}
        description={c.description as string}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => upvote.mutate()}><ThumbsUp className="h-4 w-4" />{c.upvote_count as number}</Button>
            {isStaff ? (
              <>
                <Button variant="secondary" onClick={() => advance.mutate('ACKNOWLEDGED')}>Acknowledge</Button>
                <Button variant="secondary" onClick={() => advance.mutate('IN_PROGRESS')}>Start</Button>
                <Button onClick={() => advance.mutate('RESOLVED')}>Resolve</Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge tone={priorityTone[c.priority as ComplaintPriority]}>{c.priority as string}</Badge>
        <Badge tone="brand">{(c.status as string).replaceAll('_', ' ')}</Badge>
        {c.ai_confidence ? <Badge tone="brand"><Sparkles className="mr-1 h-3 w-3" />AI {Math.round((c.ai_confidence as number) * 100)}%</Badge> : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Issue details">
            <p className="leading-relaxed text-surface-700 dark:text-surface-300">{c.description as string}</p>
          </Card>

          <Card title="Timeline" description="Status history and updates">
            <div className="relative space-y-0">
              {((c.status_history as Array<{ to_status: string; note?: string; created_at: string }>) ?? []).map((h, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950">
                      <Clock className="h-4 w-4 text-brand-600" />
                    </div>
                    {i < ((c.status_history as unknown[]).length - 1) ? <div className="mt-1 w-px flex-1 bg-surface-200 dark:bg-surface-700" /> : null}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-semibold">{h.to_status.replaceAll('_', ' ')}</p>
                    <p className="text-sm text-surface-500">{h.note ?? 'Status changed'}</p>
                    <p className="mt-1 text-xs text-surface-400">{formatRelativeTime(h.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {((c.comments as unknown[]) ?? []).length > 0 ? (
            <Card title="Comments" description="Discussion thread">
              <div className="space-y-3">
                {((c.comments as Array<{ body: string; created_at: string }>) ?? []).map((comment, i) => (
                  <div key={i} className="flex gap-3 rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-surface-400" />
                    <div>
                      <p className="text-sm">{comment.body}</p>
                      <p className="mt-1 text-xs text-surface-400">{formatRelativeTime(comment.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card title="Details">
            <dl className="space-y-4 text-sm">
              <div className="flex items-center gap-3"><User className="h-4 w-4 text-surface-400" /><div><dt className="text-surface-500">Reporter</dt><dd className="font-medium">You</dd></div></div>
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-surface-400" /><div><dt className="text-surface-500">Location</dt><dd className="font-medium">Campus building</dd></div></div>
              <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-surface-400" /><div><dt className="text-surface-500">Created</dt><dd className="font-medium">{formatRelativeTime(c.created_at as string)}</dd></div></div>
            </dl>
          </Card>

          {(similar?.data ?? []).length > 0 ? (
            <Card title="Similar reports" description="AI duplicate detection">
              <div className="space-y-3">
                {similar!.data.map((s) => (
                  <Link key={s.id} to={`/complaints/${s.id}`} className="block rounded-xl border p-3 text-sm transition hover:border-brand-300">
                    <p className="font-medium">{s.title}</p>
                    <p className="mt-1 text-xs text-brand-600">{Math.round(s.similarity * 100)}% similar</p>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
