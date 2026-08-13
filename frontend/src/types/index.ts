export type UserRole =
  | 'student'
  | 'staff'
  | 'department_manager'
  | 'administrator'
  | 'super_administrator'

export type ComplaintStatus =
  | 'PENDING'
  | 'ACKNOWLEDGED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_STUDENT'
  | 'WAITING_FOR_EXTERNAL_TEAM'
  | 'RESOLUTION_SUBMITTED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'REJECTED'

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  department_id?: string | null
  is_active: boolean
  is_verified: boolean
  avatar_url?: string | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface ApiResponse<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: string
  code: string
  message: string
  details?: unknown
  request_id?: string
}

export interface ComplaintSummary {
  id: string
  ticket_number: string
  title: string
  status: ComplaintStatus
  priority: ComplaintPriority
  category_name?: string
  building_name?: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  total_complaints: number
  open_complaints: number
  resolved_today: number
  sla_at_risk: number
  campus_health_score: number
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}
