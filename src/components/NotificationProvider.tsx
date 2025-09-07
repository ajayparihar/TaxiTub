// TaxiTub Module: Notification Adapter (unified with Toast)
// Version: v0.2.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Adapter that maps Notification API to Toast API; renders no UI and relies on ToastProvider.

import React, { ReactNode } from 'react';
import { AlertColor } from '@mui/material';
import { useToast } from './Toast';

// Keep public types the same for backward compatibility
interface NotificationItem {
  id?: string;
  message: string;
  title?: string;
  severity: AlertColor;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationItem, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

// Provider now simply returns children; it relies on ToastProvider being present higher in the tree.
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Hook bridges to the Toast API
export const useNotification = (): NotificationContextType => {
  const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();

  const mapSeverityToType = (severity: AlertColor): AlertColor => {
    switch (severity) {
      case 'success':
      case 'error':
      case 'warning':
      case 'info':
        return severity;
      default:
        return 'info';
    }
  };

  const showNotification = (n: Omit<NotificationItem, 'id'>) => {
    const type = mapSeverityToType(n.severity);
    // Map persistent to a long duration; title/action are ignored in toast adapter
    const duration = n.persistent ? 10000000 : n.duration; // ~2.7 hours; effectively persistent
    showToast(n.message, type, duration);
  };

  // Dismiss/clearAll are no-ops in adapter (Toast API is simpler); keep for API compatibility
  const dismissNotification = (_id: string) => {};
  const clearAll = () => {};

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismissNotification,
    clearAll,
  };
};

// Convenience hooks for specific notification types (unchanged public API)
export const useSuccessNotification = () => {
  const { showSuccess } = useNotification();
  return showSuccess;
};

export const useErrorNotification = () => {
  const { showError } = useNotification();
  return showError;
};

export const useWarningNotification = () => {
  const { showWarning } = useNotification();
  return showWarning;
};

export const useInfoNotification = () => {
  const { showInfo } = useNotification();
  return showInfo;
};
