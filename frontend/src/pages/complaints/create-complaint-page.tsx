import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Bot, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea, Select } from '@/components/ui/select'
import { api, ApiClientError } from '@/services/api/client'

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Please provide more detail about the issue'),
  building_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CreateComplaintPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: buildings } = useQuery({ queryKey: ['buildings'], queryFn: () => api.taxonomy.buildings() })
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const description = watch('description')

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.complaints.create(values),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] })
      toast.success('Complaint submitted — AI classification applied')
      navigate(`/complaints/${res.data.id}`)
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : 'Failed to create complaint'),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="New Report"
        title="Report an issue"
        description="Describe the problem in your own words. Our AI will suggest category, priority, and detect duplicates."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
            <Input id="title" label="Issue title" placeholder="e.g. Wi-Fi not working in C Block lab" error={errors.title?.message} {...register('title')} />
            <Textarea id="description" label="Description" placeholder="Describe what happened, where, and when…" error={errors.description?.message} {...register('description')} />
            <Select id="building_id" label="Building / Location" {...register('building_id')}>
              <option value="">Select building (optional)</option>
              {(buildings?.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting || mutation.isPending}>
              <Sparkles className="h-4 w-4" />
              Submit with AI analysis
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="border-brand-200 bg-brand-50/50 dark:border-brand-900 dark:bg-brand-950/30" padding="md">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
              <Bot className="h-5 w-5" />
              <p className="font-semibold">AI will analyze</p>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-surface-600 dark:text-surface-400">
              <li>• Category & priority suggestion</li>
              <li>• Duplicate detection</li>
              <li>• SLA deadline calculation</li>
              <li>• Department routing</li>
            </ul>
          </Card>
          {description && description.length > 10 ? (
            <Card padding="md">
              <p className="text-xs font-semibold uppercase text-surface-500">Preview</p>
              <p className="mt-2 text-sm leading-relaxed text-surface-600">{description.slice(0, 150)}{description.length > 150 ? '…' : ''}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}
