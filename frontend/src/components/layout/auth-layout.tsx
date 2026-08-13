import { Outlet, Navigate } from 'react-router-dom'
import { Activity, Bot, Shield, Sparkles, Zap } from 'lucide-react'
import { useAuthStore } from '@/stores'

const features = [
  { icon: Bot, title: 'AI Complaint Understanding', desc: 'Auto-categorize issues with confidence scores and priority recommendations.' },
  { icon: Zap, title: 'Duplicate Detection', desc: 'Find similar reports in your building before creating duplicate tickets.' },
  { icon: Activity, title: 'Campus Health Score', desc: 'Real-time service health across Wi-Fi, hostel, labs, and maintenance.' },
  { icon: Shield, title: 'SLA Intelligence', desc: 'Predict breaches and get recommended actions before deadlines hit.' },
]

export function AuthLayout() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col">
        <div className="gradient-brand absolute inset-0" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)' }} />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12 xl:p-16">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-white">CampusPulse AI</p>
                <p className="text-sm text-white/70">Campus Service Intelligence</p>
              </div>
            </div>
            <h2 className="max-w-lg font-display text-4xl font-bold leading-tight text-white xl:text-5xl">
              Transform campus complaints into intelligent operations
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/80">
              AI-powered platform for students, staff, and administrators to track, resolve, and predict campus service issues.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-md transition hover:bg-white/15">
                <f.icon className="mb-3 h-6 w-6 text-white/90" />
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-mesh flex items-center justify-center p-6 sm:p-10">
        <div className="animate-slide-up w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <p className="font-display text-xl font-bold">CampusPulse AI</p>
          </div>
          <div className="glass-panel-strong p-8 sm:p-10">
            <Outlet />
          </div>
        </div>
      </section>
    </div>
  )
}

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
