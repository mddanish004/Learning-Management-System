import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-ocean" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/courses" replace />
  }

  return children
}
