import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/empty-state'
import { api } from '@/services/api/client'

export default function UsersPage() {
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => api.users.list() })

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Users" description="Manage student, staff, and administrator accounts." />

      {isLoading ? <LoadingState /> : null}
      {!isLoading && (data?.data ?? []).length === 0 ? (
        <EmptyState icon={Users} title="No users" description="User accounts will appear here." />
      ) : null}

      <Card padding="none">
        <div className="divide-y">
          {(data?.data ?? []).map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-4 p-5 transition hover:bg-surface-50 dark:hover:bg-surface-900/50">
              <div className="flex items-center gap-4">
                <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white">
                  {u.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{u.full_name}</p>
                  <p className="text-sm text-surface-500">{u.email}</p>
                </div>
              </div>
              <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-semibold capitalize dark:bg-surface-800">
                {u.role.replaceAll('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
