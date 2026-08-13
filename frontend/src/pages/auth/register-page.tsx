import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { registerSchema, type RegisterFormValues } from '@/schemas/auth'
import { api, ApiClientError } from '@/services/api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await api.auth.register({ email: values.email, password: values.password, full_name: values.full_name })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'Unable to create account.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-surface-500">Join CampusPulse as a student to report and track campus issues.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input id="full_name" label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
        <Input id="email" label="Email address" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input id="password" label="Password" type="password" autoComplete="new-password" hint="Min 8 chars, 1 uppercase, 1 number" error={errors.password?.message} {...register('password')} />
        <Input id="confirm_password" label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm_password?.message} {...register('confirm_password')} />
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>Create account</Button>
      </form>

      <p className="text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Sign in</Link>
      </p>
    </div>
  )
}
