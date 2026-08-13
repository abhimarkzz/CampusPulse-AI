import { useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { api } from '@/services/api/client'

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { accessToken, setUser, clearAuth } = useAuthStore()

  useEffect(() => {
    if (!accessToken) return
    api.auth.me()
      .then((res) => setUser(res.data))
      .catch(() => clearAuth())
  }, [accessToken, setUser, clearAuth])

  return <>{children}</>
}
