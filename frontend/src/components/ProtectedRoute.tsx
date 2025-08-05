import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'support' | 'user';
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  allowedRoles,
  requireAuth = true 
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access with allowedRoles prop
  if (allowedRoles && user) {
    const userRole = user.role.toUpperCase();
    if (!allowedRoles.includes(userRole)) {
      // If user doesn't have required role, redirect based on their role
      switch (user.role.toLowerCase()) {
        case 'admin':
          return <Navigate to="/dashboard" replace />;
        case 'support':
          return <Navigate to="/dashboard" replace />;
        case 'user':
          return <Navigate to="/" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }
  }

  // Check role-based access with requiredRole prop (backward compatibility)
  if (requiredRole && user && user.role !== requiredRole) {
    // If user doesn't have required role, redirect based on their role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/dashboard" replace />;
      case 'support':
        return <Navigate to="/dashboard" replace />;
      case 'user':
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Allow access if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;