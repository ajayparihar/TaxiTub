// TaxiTub Module: Protected Route Component
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Route protection for role-based access control

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthService } from "../services/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "Admin" | "QueuePal";
  fallbackPath?: string;
}

/**
 * Route guard that enforces role-based access control.
 * - Public routes: no requiredRole (e.g., Passenger)
 * - Protected routes: redirects unauthenticated users to the appropriate login page and preserves the 'from' location.
 * @param props.children - Protected content
 * @param props.requiredRole - Role required to view the route
 * @param props.fallbackPath - Optional custom fallback path for unauthorized roles
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallbackPath 
}) => {
  const location = useLocation();
  const currentUser = AuthService.getCurrentUser();

  // If no role required (public route like Passenger), allow access
  if (!requiredRole) {
    return <>{children}</>;
  }

  // If user is not authenticated, redirect to appropriate login page
  if (!currentUser) {
    // Compute login path by role to route users to the correct auth screen while preserving intent via location state
    const loginPath = requiredRole === "Admin" ? "/admin/login" : "/queuepal/login";
    return (
      <Navigate 
        to={loginPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has the required role
  if (!AuthService.canAccessRoute(requiredRole)) {
    // User is authenticated but doesn't have the required role
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Default fallback based on user's role
    if (currentUser.role === "Admin") {
      return <Navigate to="/admin" replace />;
    } else if (currentUser.role === "QueuePal") {
      return <Navigate to="/queuepal" replace />;
    }
    
    // Fallback to passenger section
    return <Navigate to="/passenger" replace />;
  }

  // User has the required role, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
