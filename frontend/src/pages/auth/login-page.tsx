import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginSchema, type LoginFormValues } from '@/schemas/auth'
import { api, ApiClientError } from '@/services/api/client'
import { useAuthStore } from '@/stores'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'student@campus.local', password: 'Student123!' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await api.auth.login(values.email, values.password)
      setAuth(response.data.user, response.data.access_token, response.data.refresh_token)
      toast.success(`Welcome back, ${response.data.user.full_name.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Unable to sign in.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-surface-500">Sign in to track complaints and campus insights.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input id="email" label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input id="password" label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Sign in to CampusPulse</Button>
      </form>

      <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-surface-500">Demo accounts</p>
        <div className="mt-2 space-y-1 text-xs text-surface-600 dark:text-surface-400">
          <p><strong>Student:</strong> student@campus.local / Student123!</p>
          <p><strong>Staff:</strong> staff@campus.local / Staff123!</p>
          <p><strong>Admin:</strong> admin@campus.local / Admin123!</p>
        </div>
      </div>

      <p className="text-center text-sm text-surface-500">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Create account</Link>
      </p>
    </div>
  )
}
