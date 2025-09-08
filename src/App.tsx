// TaxiTub Module: Main Application Component
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: Bheb Developer
// Changelog: Comprehensive main app component with role-based routing, error boundaries, and accessibility features

/**
 * TaxiTub Main Application Component
 * 
 * This is the root component of the TaxiTub application that orchestrates the entire user experience.
 * It provides a comprehensive routing system with role-based access control, error boundaries,
 * accessibility features, and context providers for global state management.
 * 
 * Architecture:
 * - Router Configuration: Handles navigation between Admin, QueuePal, and Passenger interfaces
 * - Context Providers: Manages global state for notifications, dialogs, and toast messages
 * - Error Boundaries: Provides graceful error handling with fallback UI
 * - Accessibility: Implements WCAG guidelines with skip links and live regions
 * - Lazy Loading: Optimizes performance with code-splitting for route components
 * 
 * Route Structure:
 * - /passenger - Public taxi booking interface (default route)
 * - /admin - Administrative dashboard (protected, requires admin login)
 * - /queuepal - Queue management interface (protected, requires QueuePal login)
 * - /admin/login - Admin authentication
 * - /queuepal/login - QueuePal authentication
 * 
 * Features:
 * - Role-based route protection with ProtectedRoute component
 * - Lazy loading with React.Suspense for optimal performance
 * - Comprehensive error boundary coverage
 * - Accessibility features (skip links, live regions)
 * - Responsive design with Material-UI components
 * - Context providers for global state management
 * 
 * @returns {JSX.Element} The complete application UI with routing and providers
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// ========================================
// LAZY-LOADED COMPONENTS
// ========================================

/**
 * Lazy-loaded page components for code splitting and performance optimization.
 * Each major route is loaded only when needed, reducing initial bundle size.
 * This improves first-load performance and provides better user experience.
 * 
 * Benefits:
 * - Reduced initial bundle size
 * - Faster first paint and time to interactive
 * - Better perceived performance
 * - Automatic code splitting by route
 */
const AdminDashboard = React.lazy(() => 
  import("./pages/AdminDashboard")
    .then(module => ({ default: module.default }))
);

const QueuePalDashboard = React.lazy(() => 
  import("./pages/QueuePalDashboard")
    .then(module => ({ default: module.default }))
);

const PassengerBooking = React.lazy(() => 
  import("./pages/PassengerBooking")
    .then(module => ({ default: module.default }))
);

const LoginPage = React.lazy(() => 
  import("./pages/LoginPage")
    .then(module => ({ default: module.default }))
);

const LoadingScreenDemo = React.lazy(() => 
  import("./pages/LoadingScreenDemo")
    .then(module => ({ default: module.default }))
);


// ========================================
// COMPONENT IMPORTS
// ========================================

// Core layout and navigation components
import Navigation from "./components/Navigation";

// Error handling and protection components
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

// Context providers for global state management
import { ToastProvider } from "./components/Toast";
import { DialogProvider } from "./components/DialogProvider";

// Accessibility components for WCAG compliance
import { SkipLink, LiveRegion } from "./components/Accessibility";

// UI components and utilities
import { Box, Typography } from "@mui/material";
import { alpha } from "./theme";
import { useState, Suspense, useEffect } from "react";
import { PageLoadingScreen } from "./components/PremiumLoadingScreen";
import { BaseLayout } from "./ui/Layout";
import { useToast } from "./components/Toast";

// ========================================
// MAIN APPLICATION COMPONENT
// ========================================

/**
 * App Component - Main Application Entry Point
 * 
 * The root component that orchestrates the entire TaxiTub application.
 * Provides comprehensive routing, error handling, accessibility features,
 * and global state management through context providers.
 * 
 * Component Architecture:
 * 1. Context Providers (outermost) - Global state management
 * 2. Accessibility Features - Skip links and live regions
 * 3. Router Configuration - Navigation and route management
 * 4. Layout Structure - Main content container and footer
 * 5. Route Definitions - Protected and public routes with lazy loading
 * 
 * @returns {JSX.Element} Complete application UI with all providers and routing
 */
const App: React.FC = () => {
  // State for accessibility live region announcements
  const [liveMessage, setLiveMessage] = useState("");
  
  return (
    // Global Context Providers (order matters for dependencies)
    <ToastProvider>
      <DialogProvider>
        <AppContent liveMessage={liveMessage} setLiveMessage={setLiveMessage} />
      </DialogProvider>
    </ToastProvider>
  );
};

/**
 * App Content Component with Toast Access
 */
const AppContent: React.FC<{
  liveMessage: string;
  setLiveMessage: (msg: string) => void;
}> = ({ liveMessage, setLiveMessage }) => {
  const { showWarning } = useToast();
  
  // Listen for fallback authentication warnings
  useEffect(() => {
    const handleFallbackAuthWarning = (event: CustomEvent) => {
      const { message } = event.detail;
      showWarning(`⚠️ ${message}`);
    };
    
    window.addEventListener('show-fallback-auth-warning' as any, handleFallbackAuthWarning);
    
    return () => {
      window.removeEventListener('show-fallback-auth-warning' as any, handleFallbackAuthWarning);
    };
  }, [showWarning]);
  
  return (
    <>
      {/* Accessibility Features */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
          
          {/* React Router Configuration with Future Flags */}
          <Router 
            basename={import.meta.env.PROD ? '/TaxiTub' : ''}
            future={{ 
              v7_startTransition: true,     // Enable React 18 concurrent features
              v7_relativeSplatPath: true    // Improve relative path handling
            }}
          >
            {/* Main Application Layout */}
            <Box display="flex" flexDirection="column" minHeight="100vh">
              {/* Navigation Header */}
              <Navigation />
              
              {/* Main Content Container */}
              <BaseLayout id="main-content">
                {/* Live region for route announcements */}
                <RouteAnnouncer setLiveMessage={setLiveMessage} />
                <LiveRegion message={liveMessage} />
                {/* Application-wide Error Boundary */}
                <ErrorBoundary>
                  <Routes>
                    {/* Default Route - Redirect to Passenger Interface */}
                    <Route 
                      path="/" 
                      element={<Navigate to="/passenger" replace />} 
                    />
                    
                    {/* ================================ */}
                    {/* ADMIN ROUTES (Protected) */}
                    {/* ================================ */}
                    
                    {/* Admin Login Route */}
                    <Route
                      path="/admin/login"
                      element={
                        <Suspense fallback={
                          <PageLoadingScreen 
                            message="Loading Admin Login..." 
                            size="large"
                            delayMs={50}
                          />
                        }>
                          <ErrorBoundary>
                            <LoginPage userType="Admin" />
                          </ErrorBoundary>
                        </Suspense>
                      }
                    />
                    
                    {/* Protected Admin Dashboard Route */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requiredRole="Admin">
                          <Suspense fallback={
                            <PageLoadingScreen 
                              message="Loading Admin Dashboard..." 
                              size="large"
                              delayMs={50}
                            />
                          }>
                            <ErrorBoundary>
                              <AdminDashboard />
                            </ErrorBoundary>
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* ================================ */}
                    {/* QUEUEPAL ROUTES (Protected) */}
                    {/* ================================ */}
                    
                    {/* QueuePal Login Route */}
                    <Route
                      path="/queuepal/login"
                      element={
                        <Suspense fallback={
                          <PageLoadingScreen 
                            message="Loading QueuePal Login..." 
                            size="large"
                            delayMs={50}
                          />
                        }>
                          <ErrorBoundary>
                            <LoginPage userType="QueuePal" />
                          </ErrorBoundary>
                        </Suspense>
                      }
                    />
                    
                    {/* Protected QueuePal Dashboard Route */}
                    <Route
                      path="/queuepal"
                      element={
                        <ProtectedRoute requiredRole="QueuePal">
                          <Suspense fallback={
                            <PageLoadingScreen 
                              message="Loading QueuePal Dashboard..." 
                              size="large"
                              delayMs={50}
                            />
                          }>
                            <ErrorBoundary>
                              <QueuePalDashboard />
                            </ErrorBoundary>
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* ================================ */}
                    {/* PUBLIC ROUTES */}
                    {/* ================================ */}
                    
                    {/* Loading Screen Demo Route (for development) */}
                    <Route
                      path="/demo/loading"
                      element={
                        <Suspense fallback={
                          <PageLoadingScreen 
                            message="Loading Demo Page..." 
                            size="large"
                            delayMs={50}
                          />
                        }>
                          <ErrorBoundary>
                            <LoadingScreenDemo />
                          </ErrorBoundary>
                        </Suspense>
                      }
                    />
                    
                    {/* Public Passenger Booking Route */}
                    <Route
                      path="/passenger"
                      element={
                        <Suspense fallback={
                          <PageLoadingScreen 
                            message="Loading Passenger Booking..." 
                            size="large"
                            delayMs={50}
                          />
                        }>
                          <ErrorBoundary>
                            <PassengerBooking />
                          </ErrorBoundary>
                        </Suspense>
                      }
                    />
                    
                    {/* Catch-all Route - Redirect unknown paths to passenger */}
                    <Route 
                      path="*" 
                      element={<Navigate to="/passenger" replace />} 
                    />
                  </Routes>
                </ErrorBoundary>
              </BaseLayout>
              
              {/* Application Footer */}
              <Box 
                component="footer" 
                sx={{ 
                  py: { xs: 3, sm: 4 },
                  px: { xs: 2, sm: 3 },
                  textAlign: "center",
                  background: (theme) => theme.palette.mode === 'light' 
                    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                    : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: (theme) => theme.palette.mode === 'light'
                    ? `0 -2px 10px ${alpha(theme.palette.primary.main, 0.04)}`
                    : `0 -2px 10px ${alpha('#000', 0.1)}`,
                  mt: 'auto'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: (theme) => theme.palette.text.secondary,
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                    '& .brand': {
                      color: (theme) => theme.palette.primary.main,
                      fontWeight: 600
                    }
                  }}
                >
                  &copy; 2025 <span className="brand">TaxiTub</span>
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: (theme) => theme.palette.text.disabled,
                    mt: 0.5,
                    display: 'block',
                    fontSize: '0.75rem'
                  }}
                >
                </Typography>
              </Box>
            </Box>
          </Router>
    </>
  );
};

/**
 * Export the App component as the default export
 * 
 * This component serves as the entry point for the entire TaxiTub application.
 * It should be imported and rendered in the root of the React application
 * (typically in index.tsx or main.tsx).
 * 
 * Usage:
 * ```tsx
 * import App from './App';
 * 
 * root.render(<App />);
 * ```
 */
export default App;

/**
 * Small helper component inside Router context to announce route changes
 */
const RouteAnnouncer: React.FC<{ setLiveMessage: (msg: string) => void }> = ({ setLiveMessage }) => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const titleMap: Record<string, string> = {
      "/passenger": "TaxiTub · Passenger",
      "/admin": "TaxiTub · Admin",
      "/queuepal": "TaxiTub · QueuePal",
      "/admin/login": "TaxiTub · Admin Login",
      "/queuepal/login": "TaxiTub · QueuePal Login",
    };
    const announceMap: Record<string, string> = {
      "/passenger": "Passenger booking page loaded",
      "/admin": "Admin dashboard loaded",
      "/queuepal": "QueuePal dashboard loaded",
      "/admin/login": "Admin login page loaded",
      "/queuepal/login": "QueuePal login page loaded",
    };

    document.title = titleMap[path] ?? "TaxiTub";
    setLiveMessage(announceMap[path] ?? "Page updated");
  }, [location.pathname, setLiveMessage]);

  return null;
};
