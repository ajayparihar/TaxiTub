// TaxiTub Module: Feature-Specific Error Boundaries
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Granular error boundaries for different application features

import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Alert,
  Collapse,
  Divider,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BugReportRoundedIcon from "@mui/icons-material/BugReportRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

interface Props {
  children: ReactNode;
  feature: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showGoHome?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

const MAX_RETRY_COUNT = 3;

// Feature-specific error messages and recovery suggestions
const FEATURE_ERROR_MESSAGES = {
  "admin-dashboard": {
    title: "Admin Dashboard Error",
    description: "The admin dashboard encountered an error. This might affect car management and system monitoring.",
    suggestions: [
      "Try refreshing the dashboard",
      "Check your internet connection",
      "Navigate to a different section and return",
      "Contact support if the problem persists"
    ]
  },
  "queue-management": {
    title: "Queue Management Error", 
    description: "The queue management system encountered an error. Queue operations might be affected.",
    suggestions: [
      "Refresh the queue view",
      "Try adding cars to queue again",
      "Check if all cars are properly registered",
      "Contact support for queue-related issues"
    ]
  },
  "passenger-booking": {
    title: "Passenger Booking Error",
    description: "The passenger booking system encountered an error. Taxi requests might be affected.", 
    suggestions: [
      "Try booking again with the same details",
      "Check if there are available taxis",
      "Verify passenger information is correct",
      "Contact support if booking continues to fail"
    ]
  },
  "car-management": {
    title: "Car Management Error",
    description: "The car management system encountered an error. Car operations might be affected.",
    suggestions: [
      "Try the car operation again",
      "Check if all required fields are filled",
      "Verify car details are correct",
      "Refresh the page and retry"
    ]
  },
  "navigation": {
    title: "Navigation Error",
    description: "The navigation system encountered an error. App navigation might be affected.",
    suggestions: [
      "Use browser back/forward buttons",
      "Click on the TaxiTub logo to go home",
      "Try refreshing the page",
      "Clear browser cache if problems persist"
    ]
  },
  "default": {
    title: "Application Error",
    description: "An unexpected error occurred in this part of the application.",
    suggestions: [
      "Try refreshing this section",
      "Navigate to a different area",
      "Check your internet connection",
      "Contact support if the error persists"
    ]
  }
} as const;

export class FeatureErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`TaxiTub Feature Error [${this.props.feature}]:`, error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to external error tracking service here if needed
    // Example: Sentry.captureException(error, { tags: { feature: this.props.feature } });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= MAX_RETRY_COUNT) {
      return;
    }

    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: retryCount + 1
    });
    
    // Add a small delay to prevent immediate re-error
    this.retryTimeoutId = setTimeout(() => {
      // Force re-render by updating state
      this.forceUpdate();
    }, 100);
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportError = () => {
    const { feature } = this.props;
    const { error } = this.state;
    
    // Create error report (could be enhanced to actually send to support)
    const errorReport = {
      feature,
      error: error?.message,
      stack: error?.stack,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    
    console.log("Error Report:", errorReport);
    
    // In a real app, send this to your error reporting service
    // Example: api.post('/error-reports', errorReport);
    
    alert("Error report has been logged. Thank you for helping us improve TaxiTub!");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { feature, showRetry = true, showGoHome = true } = this.props;
      const { retryCount } = this.state;
      const errorConfig = FEATURE_ERROR_MESSAGES[feature as keyof typeof FEATURE_ERROR_MESSAGES] || 
                         FEATURE_ERROR_MESSAGES.default;
      
      const canRetry = retryCount < MAX_RETRY_COUNT;

      return (
        <Box sx={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
          <Paper sx={{ p: 4, maxWidth: 600, width: "100%" }}>
            <Stack spacing={3}>
              {/* Error Icon and Title */}
              <Box sx={{ textAlign: "center" }}>
                <BugReportRoundedIcon 
                  sx={{ fontSize: 48, color: "error.main", mb: 1 }} 
                />
                <Typography variant="h5" gutterBottom>
                  {errorConfig.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {errorConfig.description}
                </Typography>
              </Box>

              <Divider />

              {/* Action Buttons */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                {showRetry && canRetry && (
                  <Button
                    variant="contained"
                    startIcon={<RefreshRoundedIcon />}
                    onClick={this.handleRetry}
                    size="large"
                  >
                    Try Again
                  </Button>
                )}
                
                {showGoHome && (
                  <Button
                    variant="outlined"
                    startIcon={<HomeRoundedIcon />}
                    onClick={this.handleGoHome}
                    size="large"
                  >
                    Go to Home
                  </Button>
                )}

                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<BugReportRoundedIcon />}
                  onClick={this.handleReportError}
                  size="large"
                >
                  Report Issue
                </Button>
              </Stack>

              {/* Retry count warning */}
              {retryCount > 0 && (
                <Alert severity={retryCount >= MAX_RETRY_COUNT ? "error" : "warning"}>
                  {retryCount >= MAX_RETRY_COUNT 
                    ? "Maximum retry attempts reached. Please try a different approach or contact support."
                    : `Retry attempt ${retryCount}/${MAX_RETRY_COUNT}. If the issue persists, try going to the home page.`
                  }
                </Alert>
              )}

              {/* Recovery Suggestions */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  What you can try:
                </Typography>
                <Stack spacing={0.5}>
                  {errorConfig.suggestions.map((suggestion, index) => (
                    <Typography key={index} variant="body2" sx={{ display: "flex", alignItems: "center" }}>
                      <Box component="span" sx={{ mr: 1, opacity: 0.7 }}>•</Box>
                      {suggestion}
                    </Typography>
                  ))}
                </Stack>
              </Box>

              {/* Development Error Details */}
              <Collapse in={import.meta.env.DEV && !!this.state.error}>
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Error Details (Development Only)
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ 
                    whiteSpace: "pre-wrap", 
                    fontSize: "0.75rem",
                    maxHeight: 200,
                    overflow: "auto",
                    mb: 1 
                  }}>
                    {this.state.error?.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography variant="body2" component="pre" sx={{ 
                      whiteSpace: "pre-wrap", 
                      fontSize: "0.75rem",
                      maxHeight: 200,
                      overflow: "auto" 
                    }}>
                      Component Stack:
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Alert>
              </Collapse>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for specific features
export const AdminErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <FeatureErrorBoundary feature="admin-dashboard" fallback={fallback}>
    {children}
  </FeatureErrorBoundary>
);

export const QueueErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <FeatureErrorBoundary feature="queue-management" fallback={fallback}>
    {children}
  </FeatureErrorBoundary>
);

export const BookingErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <FeatureErrorBoundary feature="passenger-booking" fallback={fallback}>
    {children}
  </FeatureErrorBoundary>
);

export const CarManagementErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <FeatureErrorBoundary feature="car-management" fallback={fallback}>
    {children}
  </FeatureErrorBoundary>
);

export const NavigationErrorBoundary: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <FeatureErrorBoundary feature="navigation" fallback={fallback}>
    {children}
  </FeatureErrorBoundary>
);
