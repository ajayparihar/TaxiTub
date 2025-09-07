// TaxiTub Module: Glassmorphic Loading Component
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Theme-consistent glassmorphic loading screens and overlays

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  alpha,
  useTheme,
} from '@mui/material';


interface GlassmorphicLoadingProps {
  message?: string;
  size?: number;
  variant?: 'overlay' | 'inline' | 'fullscreen';
  open?: boolean;
  onClose?: () => void;
}

const GlassmorphicLoading: React.FC<GlassmorphicLoadingProps> = ({
  message,
  size = 40,
  variant = 'inline',
  open = true,
  onClose,
}) => {
  const theme = useTheme();

  const LoadingContent = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        p: variant === 'inline' ? 2 : 4,
        borderRadius: variant === 'inline' ? 2 : 3,
        backgroundColor: variant === 'inline' ? 'transparent' : theme.palette.background.paper,
        border: variant === 'inline' ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.4)}`,
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Custom loader */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={size}
          thickness={3}
          sx={{
            color: theme.palette.primary.main,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
        
        {/* Inner accent circle */}
        <CircularProgress
          size={size * 0.6}
          thickness={3}
          variant="determinate"
          value={75}
          sx={{
            color: theme.palette.secondary.main,
            position: 'absolute',
            opacity: 0.4,
            transform: 'rotate(45deg)',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }}
        />
      </Box>

      {/* Loading message */}
      {message && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            textAlign: 'center',
            fontWeight: 500,
            maxWidth: 300,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (variant === 'fullscreen') {
    return (
      <Backdrop
        open={open}
        onClick={onClose}
        sx={{
          backgroundColor: alpha(theme.palette.common.black, 0.7),
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          zIndex: theme.zIndex.modal + 1,
        }}
      >
        <LoadingContent />
      </Backdrop>
    );
  }

  if (variant === 'overlay') {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.background.default, 0.75),
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: 'inherit',
          zIndex: 1,
        }}
      >
        <LoadingContent />
      </Box>
    );
  }

  // Inline variant
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <LoadingContent />
    </Box>
  );
};

// Quick loading overlay for buttons and cards
export const LoadingOverlay: React.FC<{ loading: boolean; message?: string }> = ({
  loading,
  message
}) => {
  if (!loading) return null;

  return (
    <GlassmorphicLoading
      variant="overlay"
      {...(message && { message })}
      size={32}
    />
  );
};

// Inline loading for content areas
export const InlineLoading: React.FC<{ message?: string; size?: number }> = ({
  message = 'Loading...',
  size = 40
}) => (
  <GlassmorphicLoading
    variant="inline"
    message={message}
    size={size}
  />
);

// Fullscreen loading modal
export const FullscreenLoading: React.FC<{
  open: boolean;
  message?: string;
  onClose?: () => void;
}> = ({ open, message = 'Loading...', onClose }) => (
  <GlassmorphicLoading
    variant="fullscreen"
    open={open}
    message={message}
    {...(onClose && { onClose })}
    size={60}
  />
);

export default GlassmorphicLoading;
