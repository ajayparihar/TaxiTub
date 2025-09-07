// TaxiTub Module: Dialog Provider
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: MUI-based dialog system replacing window.confirm() calls

import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  Close as CloseIcon,
} from '@mui/icons-material';

type DialogVariant = 'confirm' | 'info' | 'warning' | 'error' | 'success' | 'custom';

interface DialogConfig {
  id: string;
  variant: DialogVariant;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  showCancel?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  persistent?: boolean;
  customContent?: ReactNode;
  loading?: boolean;
}

interface DialogContextType {
  openDialog: (config: Omit<DialogConfig, 'id'>) => Promise<boolean>;
  openConfirmDialog: (title: string, message: string, options?: Partial<DialogConfig>) => Promise<boolean>;
  openInfoDialog: (title: string, message: string, options?: Partial<DialogConfig>) => Promise<boolean>;
  openWarningDialog: (title: string, message: string, options?: Partial<DialogConfig>) => Promise<boolean>;
  openErrorDialog: (title: string, message: string, options?: Partial<DialogConfig>) => Promise<boolean>;
  closeDialog: (id?: string) => void;
  closeAllDialogs: () => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

const getDialogIcon = (variant: DialogVariant) => {
  const iconProps = { fontSize: 'large' as const, sx: { mr: 1 } };
  
  switch (variant) {
    case 'success':
      return <CheckCircleOutline color="success" {...iconProps} />;
    case 'error':
      return <ErrorOutline color="error" {...iconProps} />;
    case 'warning':
      return <WarningAmber color="warning" {...iconProps} />;
    case 'info':
      return <InfoOutlined color="info" {...iconProps} />;
    default:
      return null;
  }
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const openDialog = (config: Omit<DialogConfig, 'id'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = generateId();
      const dialogConfig: DialogConfig = {
        id,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        maxWidth: 'sm',
        fullScreen: fullScreen,
        persistent: false,
        ...config,
        onConfirm: async () => {
          if (config.onConfirm) {
            setLoadingStates(prev => ({ ...prev, [id]: true }));
            try {
              await config.onConfirm();
            } finally {
              setLoadingStates(prev => ({ ...prev, [id]: false }));
            }
          }
          closeDialog(id);
          resolve(true);
        },
        onCancel: () => {
          if (config.onCancel) {
            config.onCancel();
          }
          closeDialog(id);
          resolve(false);
        },
      };

      setDialogs(prev => [...prev, dialogConfig]);
    });
  };

  const openConfirmDialog = (title: string, message: string, options?: Partial<DialogConfig>) => {
    return openDialog({
      variant: 'confirm',
      title,
      message,
      ...options,
    });
  };

  const openInfoDialog = (title: string, message: string, options?: Partial<DialogConfig>) => {
    return openDialog({
      variant: 'info',
      title,
      message,
      showCancel: false,
      confirmText: 'OK',
      ...options,
    });
  };

  const openWarningDialog = (title: string, message: string, options?: Partial<DialogConfig>) => {
    return openDialog({
      variant: 'warning',
      title,
      message,
      ...options,
    });
  };

  const openErrorDialog = (title: string, message: string, options?: Partial<DialogConfig>) => {
    return openDialog({
      variant: 'error',
      title,
      message,
      showCancel: false,
      confirmText: 'OK',
      ...options,
    });
  };

  const closeDialog = (id?: string) => {
    if (id) {
      setDialogs(prev => prev.filter(dialog => dialog.id !== id));
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    } else if (dialogs.length > 0) {
      const lastDialog = dialogs[dialogs.length - 1];
      if (lastDialog) {
        closeDialog(lastDialog.id);
      }
    }
  };

  const closeAllDialogs = () => {
    setDialogs([]);
    setLoadingStates({});
  };

  const contextValue: DialogContextType = {
    openDialog,
    openConfirmDialog,
    openInfoDialog,
    openWarningDialog,
    openErrorDialog,
    closeDialog,
    closeAllDialogs,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {dialogs.map((dialog) => (
        <Dialog
          key={dialog.id}
          open={true}
          onClose={dialog.persistent ? undefined : dialog.onCancel}
          maxWidth={dialog.maxWidth || 'sm'}
          fullWidth
          fullScreen={dialog.fullScreen || false}
          aria-labelledby={`dialog-title-${dialog.id}`}
          aria-describedby={`dialog-description-${dialog.id}`}
          disableEnforceFocus={false}
          disableAutoFocus={false}
          disableRestoreFocus={false}
          sx={{
            '& .MuiDialog-paper': {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            },
          }}
        >
          <DialogTitle
            id={`dialog-title-${dialog.id}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getDialogIcon(dialog.variant)}
              <Typography variant="h6" component="span">
                {dialog.title}
              </Typography>
            </Box>
            {!dialog.persistent && (
              <IconButton
                aria-label="close"
                onClick={dialog.onCancel}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>
          
          <DialogContent sx={{ pt: 1 }}>
            {dialog.customContent ? (
              dialog.customContent
            ) : (
              <DialogContentText
                id={`dialog-description-${dialog.id}`}
                sx={{
                  color: 'text.primary',
                  fontSize: '1rem',
                  lineHeight: 1.5,
                }}
              >
                {dialog.message}
              </DialogContentText>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            {dialog.showCancel && (
              <Button
                onClick={dialog.onCancel}
                disabled={loadingStates[dialog.id] || false}
                variant="outlined"
                size="large"
              >
                {dialog.cancelText}
              </Button>
            )}
            <Button
              onClick={dialog.onConfirm}
              disabled={loadingStates[dialog.id] || false}
              variant="contained"
              size="large"
              autoFocus
            >
              {loadingStates[dialog.id] ? 'Loading...' : dialog.confirmText}
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
};

// Convenience hooks for common dialog types
export const useConfirmDialog = () => {
  const { openConfirmDialog } = useDialog();
  return openConfirmDialog;
};

export const useInfoDialog = () => {
  const { openInfoDialog } = useDialog();
  return openInfoDialog;
};

export const useWarningDialog = () => {
  const { openWarningDialog } = useDialog();
  return openWarningDialog;
};

export const useErrorDialog = () => {
  const { openErrorDialog } = useDialog();
  return openErrorDialog;
};
