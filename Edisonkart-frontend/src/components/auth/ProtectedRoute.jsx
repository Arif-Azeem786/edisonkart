import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    // Redirect to login but save the location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Allow EMPLOYEE and VENDOR to access ADMIN routes
    if (!(requiredRole === 'ADMIN' && (user?.role === 'EMPLOYEE' || user?.role === 'VENDOR'))) {
      // Redirect to home if they don't have the required role
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute