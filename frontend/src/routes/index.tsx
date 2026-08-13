import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout, ProtectedRoute } from '@/components/layout/auth-layout'
import { RouteErrorBoundary } from '@/components/ui/route-error-boundary'

const LoginPage = lazy(() => import('@/pages/auth/login-page'))
const RegisterPage = lazy(() => import('@/pages/auth/register-page'))
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page'))
const ComplaintsPage = lazy(() => import('@/pages/complaints/complaints-page'))
const CreateComplaintPage = lazy(() => import('@/pages/complaints/create-complaint-page'))
const ComplaintDetailPage = lazy(() => import('@/pages/complaints/complaint-detail-page'))
const CampusAiPage = lazy(() => import('@/pages/campus-ai/campus-ai-page'))
const AnalyticsPage = lazy(() => import('@/pages/analytics/analytics-page'))
const MapPage = lazy(() => import('@/pages/map/map-page'))
const NotificationsPage = lazy(() => import('@/pages/notifications/notifications-page'))
const AdminPage = lazy(() => import('@/pages/admin/admin-page'))
const UsersPage = lazy(() => import('@/pages/users/users-page'))
const SettingsPage = lazy(() => import('@/pages/settings/settings-page'))

function PageLoader() {
  return <div className="flex min-h-[40vh] items-center justify-center text-sm text-surface-500">Loading…</div>
}

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <SuspenseWrap><LoginPage /></SuspenseWrap> },
      { path: '/register', element: <SuspenseWrap><RegisterPage /></SuspenseWrap> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <SuspenseWrap><DashboardPage /></SuspenseWrap> },
          { path: '/complaints', element: <SuspenseWrap><ComplaintsPage /></SuspenseWrap> },
          { path: '/complaints/new', element: <SuspenseWrap><CreateComplaintPage /></SuspenseWrap> },
          { path: '/complaints/:id', element: <SuspenseWrap><ComplaintDetailPage /></SuspenseWrap> },
          { path: '/campus-ai', element: <SuspenseWrap><CampusAiPage /></SuspenseWrap> },
          { path: '/analytics', element: <SuspenseWrap><AnalyticsPage /></SuspenseWrap> },
          { path: '/map', element: <SuspenseWrap><MapPage /></SuspenseWrap> },
          { path: '/notifications', element: <SuspenseWrap><NotificationsPage /></SuspenseWrap> },
          { path: '/admin', element: <SuspenseWrap><AdminPage /></SuspenseWrap> },
          { path: '/users', element: <SuspenseWrap><UsersPage /></SuspenseWrap> },
          { path: '/settings', element: <SuspenseWrap><SettingsPage /></SuspenseWrap> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
