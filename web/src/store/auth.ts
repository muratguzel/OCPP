import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'super_admin' | 'admin' | 'user'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  tenantId?: string | null
  tenantName?: string
  isActive?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, refreshToken })
      },
      clearAuth: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null, refreshToken: null })
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user }) }
  )
)
