// TaxiTub Module: Toast Notification System
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Toast notifications to replace alert() calls

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Snackbar,
  AlertColor,
  Slide,
  useTheme,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CheckCircleOutlined,
  ErrorOutlined,
  WarningAmberOutlined,
  InfoOutlined,
  CloseRounded,
} from "@mui/icons-material";
import { UI_CONFIG } from "../constants";

/**
 * Toast notification data structure
 * Represents a single toast message with display properties
 */
interface Toast {
  id: string;           // Unique identifier for the toast instance
  message: string;      // Text content to display to user
  type: AlertColor;     // Visual theme (success, error, warning, info)
  duration?: number;    // Auto-dismiss timeout in milliseconds
}

/**
 * Toast Context API interface
 * Provides methods for displaying different types of notifications
 * Used throughout the app to replace intrusive alert() calls
 */
interface ToastContextType {
  showToast: (message: string, type?: AlertColor, duration?: number) => void; // Generic toast with custom settings
  showSuccess: (message: string) => void;  // Pre-configured success notification
  showError: (message: string) => void;    // Pre-configured error notification
  showWarning: (message: string) => void;  // Pre-configured warning notification
  showInfo: (message: string) => void;     // Pre-configured info notification
}

/**
 * React Context for toast notifications
 * Provides toast functionality to any component in the app
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Custom slide transition component for toast animations
 * Provides smooth slide-up animation when toasts appear
 * Handles Material-UI Snackbar transition requirements
 */
const SlideTransition = React.forwardRef<
  unknown,
  any
>(function SlideTransition({ children, ...props }, ref) {
  return (
    <Slide {...props} ref={ref} direction="up">
      {children}
    </Slide>
  );
});

/**
 * Custom glassmorphic toast component
 * Features modern glass-effect styling with blur backgrounds
 * Provides visual hierarchy and branded appearance
 */
const GlassmorphicToast = React.forwardRef<
  HTMLDivElement,
  {
    message: string;     // Toast content text
    type: AlertColor;    // Visual theme variant
    onClose: () => void; // Handler for manual dismissal
  }
>(({ message, type, onClose }, ref) => {
  const theme = useTheme();
  
  /**
   * Maps toast type to appropriate Material-UI icon
   * Provides visual cues for different message types
   */
  const getIcon = (type: AlertColor) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined />;
      case 'error': return <ErrorOutlined />;
      case 'warning': return <WarningAmberOutlined />;
      case 'info': return <InfoOutlined />;
      default: return <InfoOutlined />;  // Fallback for unknown types
    }
  };
  
  /**
   * Color scheme generator for different toast types
   * Creates consistent color palette with proper opacity levels
   * Uses Material-UI colors for accessibility compliance
   */
  const getColors = (type: AlertColor) => {
    const isDark = theme.palette.mode === 'dark';
    
    switch (type) {
      case 'success':
        return {
          bg: alpha(theme.palette.success.main, isDark ? 0.08 : 0.06),
          border: alpha(theme.palette.success.main, isDark ? 0.15 : 0.12),
          icon: alpha(theme.palette.success.main, isDark ? 0.8 : 0.7),
          text: theme.palette.text.primary
        };
      case 'error':
        return {
          bg: alpha(theme.palette.error.main, isDark ? 0.08 : 0.06),
          border: alpha(theme.palette.error.main, isDark ? 0.15 : 0.12),
          icon: alpha(theme.palette.error.main, isDark ? 0.8 : 0.7),
          text: theme.palette.text.primary
        };
      case 'warning':
        return {
          bg: alpha(theme.palette.warning.main, isDark ? 0.08 : 0.06),
          border: alpha(theme.palette.warning.main, isDark ? 0.15 : 0.12),
          icon: alpha(theme.palette.warning.main, isDark ? 0.8 : 0.7),
          text: theme.palette.text.primary
        };
      case 'info':
      default:
        return {
          bg: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.06),
          border: alpha(theme.palette.primary.main, isDark ? 0.15 : 0.12),
          icon: alpha(theme.palette.primary.main, isDark ? 0.8 : 0.7),
          text: theme.palette.text.primary
        };
    }
  };
  
  const colors = getColors(type);
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        minWidth: 320,
        maxWidth: 400,
        backgroundColor: alpha(theme.palette.background.paper, isDark ? 0.92 : 0.98),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        borderRadius: 3,
        boxShadow: `0 4px 20px ${alpha(colors.icon, 0.12)}, 0 2px 8px ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.06)}`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${colors.icon}, ${alpha(colors.icon, 0.5)})`,
        }
      }}
    >
      <Box
        sx={{
          color: colors.icon,
          display: 'flex',
          alignItems: 'center',
          fontSize: '1.1rem',
          opacity: 0.9
        }}
      >
        {getIcon(type)}
      </Box>
      
      <Typography
        variant="body2"
        sx={{
          color: colors.text,
          flexGrow: 1,
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
      
      <IconButton
        onClick={onClose}
        size="small"
        aria-label="Close notification"
        sx={{
          color: alpha(colors.text, 0.7),
          '&:hover': {
            color: colors.text,
            backgroundColor: alpha(colors.icon, 0.1)
          },
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
          }
        }}
      >
        <CloseRounded fontSize="small" />
      </IconButton>
    </Box>
  );
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Core toast display function
   * Handles toast creation, display, and automatic dismissal
   * Uses callback optimization to prevent unnecessary re-renders
   */
  const showToast = useCallback(
    (message: string, type: AlertColor = "info", duration?: number) => {
      // Use provided duration or fall back to global configuration
      const actualDuration = duration ?? UI_CONFIG.TOAST_DURATION;
      
      // Generate unique ID combining timestamp and random number for collision avoidance
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: Toast = { id, message, type, duration: actualDuration };
      
      // Add toast to active list (triggers re-render to show toast)
      setToasts((prev) => [...prev, newToast]);

      // Schedule automatic removal after specified duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, actualDuration);
    },
    [] // Empty dependency array - function never changes
  );

  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, "warning");
  }, [showToast]);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info");
  }, [showToast]);

  const handleClose = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      {toasts.map((toast, index) => (
          <Snackbar
            key={toast.id}
            open={true}
            {...(toast.duration !== undefined && { autoHideDuration: toast.duration })}
            onClose={() => handleClose(toast.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            // Stack multiple toasts with proper spacing
            transform: `translateY(${index * -80}px)`,
            zIndex: 9999 + index,
          }}
        >
          <GlassmorphicToast
            message={toast.message}
            type={toast.type}
            onClose={() => handleClose(toast.id)}
          />
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
