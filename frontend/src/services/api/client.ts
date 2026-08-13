import type {
  ApiResponse,
  AuthTokens,
  ComplaintStatus,
  ComplaintSummary,
  DashboardStats,
  NotificationItem,
  User,
} from '@/types'
import { useAuthStore } from '@/stores'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

class ApiClientError extends Error {
  code: string
  details?: unknown
  requestId?: string

  constructor(error: { code: string; message: string; details?: unknown; request_id?: string }) {
    super(error.message)
    this.name = 'ApiClientError'
    this.code = error.code
    this.details = error.details
    this.requestId = error.request_id
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { accessToken } = useAuthStore.getState()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    let payload = { code: 'REQUEST_FAILED', message: response.statusText }
    try { payload = await response.json() } catch { /* ignore */ }
    throw new ApiClientError(payload as never)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<ApiResponse<AuthTokens & { user: User }>>('/api/v1/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }),
    register: (payload: { email: string; password: string; full_name: string }) =>
      request<ApiResponse<User>>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request<ApiResponse<User>>('/api/v1/auth/me'),
    logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),
  },
  complaints: {
    list: (params?: Record<string, string | number>) => {
      const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : ''
      return request<ApiResponse<ComplaintSummary[]>>(`/api/v1/complaints${qs}`)
    },
    get: (id: string) => request<ApiResponse<Record<string, unknown>>>(`/api/v1/complaints/${id}`),
    create: (payload: Record<string, unknown>) =>
      request<ApiResponse<ComplaintSummary>>('/api/v1/complaints', { method: 'POST', body: JSON.stringify(payload) }),
    updateStatus: (id: string, status: ComplaintStatus, note?: string) =>
      request<ApiResponse<ComplaintSummary>>(`/api/v1/complaints/${id}/status`, {
        method: 'PATCH', body: JSON.stringify({ status, note }),
      }),
    addComment: (id: string, body: string, is_internal = false) =>
      request<ApiResponse<{ id: string; body: string }>>(`/api/v1/complaints/${id}/comments`, {
        method: 'POST', body: JSON.stringify({ body, is_internal }),
      }),
    upvote: (id: string) => request<ApiResponse<{ upvoted: boolean; upvote_count: number }>>(`/api/v1/complaints/${id}/upvote`, { method: 'POST' }),
    similar: (id: string) => request<ApiResponse<Array<{ id: string; title: string; similarity: number }>>>(`/api/v1/complaints/${id}/similar`),
  },
  taxonomy: {
    categories: () => request<ApiResponse<Array<{ id: string; name: string; subcategories: Array<{ id: string; name: string }> }>>>('/api/v1/categories'),
    departments: () => request<ApiResponse<Array<{ id: string; name: string }>>>('/api/v1/departments'),
    mapOverview: () => request<ApiResponse<{
      campus: { name: string; latitude: number; longitude: number; address: string; pincode: string }
      stats: { total_buildings: number; open_complaints: number; active_clusters: number; hotspots: number }
      buildings: Array<{ id: string; name: string; code: string; latitude: number; longitude: number; open_complaints: number; total_complaints: number; severity: string }>
      clusters: Array<Record<string, unknown>>
      recent_pins: Array<{ id: string; title: string; ticket_number: string; priority: string; status: string; latitude: number; longitude: number }>
    }>>('/api/v1/locations/map-overview'),
    buildings: () => request<ApiResponse<Array<{ id: string; name: string; code: string; latitude: number; longitude: number }>>>('/api/v1/locations/buildings'),
  },
  analytics: {
    dashboard: () => request<ApiResponse<DashboardStats>>('/api/v1/analytics/dashboard'),
    trends: () => request<ApiResponse<Array<{ category: string; count: number }>>>('/api/v1/analytics/trends'),
    insights: () => request<ApiResponse<Array<Record<string, unknown>>>>('/api/v1/analytics/insights'),
  },
  notifications: {
    list: (unreadOnly = false) =>
      request<ApiResponse<NotificationItem[]>>(`/api/v1/notifications?unread_only=${unreadOnly}`),
    markRead: (id: string) => request<ApiResponse<{ read: boolean }>>(`/api/v1/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<ApiResponse<{ read_all: boolean }>>('/api/v1/notifications/read-all', { method: 'POST' }),
  },
  ai: {
    chat: (message: string) =>
      request<ApiResponse<{ reply: string; confidence: number; action?: string; target?: string }>>('/api/v1/ai/assistant', {
        method: 'POST', body: JSON.stringify({ message }),
      }),
    clusters: () => request<ApiResponse<Array<Record<string, unknown>>>>('/api/v1/ai/clusters'),
  },
  admin: {
    overview: () => request<ApiResponse<Record<string, unknown>>>('/api/v1/admin/overview'),
    liveComplaints: () => request<ApiResponse<ComplaintSummary[]>>('/api/v1/admin/complaints/live'),
    auditLogs: () => request<ApiResponse<Array<Record<string, unknown>>>>('/api/v1/admin/audit-logs'),
  },
  users: {
    list: () => request<ApiResponse<User[]>>('/api/v1/users'),
  },
  health: () => request<{ status: string }>('/health'),
}

export { ApiClientError }
