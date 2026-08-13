import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/empty-state'
import { ApiErrorState, BackendStatusBanner } from '@/components/ui/api-error-state'
import { api } from '@/services/api/client'
import { formatRelativeTime } from '@/lib/utils'

export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: () => api.health(), retry: 1 })
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.notifications.list(),
    retry: 1,
  })
  const markAll = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    },
  })

  const notifications = data?.data ?? []

  return (
    <div className="space-y-8">
      <BackendStatusBanner ok={health?.status === 'ok'} />

      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Status updates, assignments, SLA alerts, and campus notifications."
        action={<Button variant="secondary" onClick={() => markAll.mutate()} loading={markAll.isPending} disabled={notifications.length === 0}><CheckCheck className="h-4 w-4" />Mark all read</Button>}
      />

      {isLoading ? <LoadingState /> : null}
      {isError ? <ApiErrorState title="Notifications unavailable" onRetry={() => refetch()} /> : null}

      {!isLoading && !isError && notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Run the backend seed script to load demo notifications, or create a complaint to receive updates." />
      ) : null}

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={`transition ${!n.is_read ? 'border-brand-300 bg-brand-50/30 dark:border-brand-800 dark:bg-brand-950/20' : ''}`} padding="md">
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-xl p-2.5 ${!n.is_read ? 'bg-brand-100 dark:bg-brand-950' : 'bg-surface-100 dark:bg-surface-800'}`}>
                <Bell className={`h-4 w-4 ${!n.is_read ? 'text-brand-600' : 'text-surface-400'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{n.title}</p>
                  {!n.is_read ? <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span> : null}
                </div>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">{n.message}</p>
                <p className="mt-2 text-xs text-surface-400">{formatRelativeTime(n.created_at)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
