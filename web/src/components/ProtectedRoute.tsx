import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, type Role } from '@/store/auth'

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles?: Role[]
}) {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace /> 
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'user') {
      return <Navigate to="/portal/history" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
