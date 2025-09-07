// TaxiTub Module: Enhanced Loading Screen
// Version: v0.1.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Simple, clean loading screen with theme support

import React, { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Fade,
  useTheme,
  alpha,
} from '@mui/material';
import { keyframes } from '@emotion/react';

// Simple animations
const fadeInAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseAnimation = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

interface EnhancedLoadingScreenProps {
  message?: string;
  size?: number;
  fullHeight?: boolean;
  variant?: 'page' | 'component' | 'overlay';
  showLogo?: boolean;
  delayMs?: number;
  onClose?: () => void;
}

const EnhancedLoadingScreen: React.FC<EnhancedLoadingScreenProps> = ({
  message = 'Loading...',
  size = 48,
  fullHeight = false,
  variant = 'component',
  delayMs = 100,
  onClose,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Delay showing loading to prevent flicker on fast loads
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Dynamic container styles based on variant
  const getContainerStyles = () => {
    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      minHeight: fullHeight ? '60vh' : 'auto',
      py: 4,
      px: 2,
    };

    switch (variant) {
      case 'page':
        return {
          ...baseStyles,
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.background.default,
          zIndex: theme.zIndex.modal + 1,
        };

      case 'overlay':
        return {
          ...baseStyles,
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha(theme.palette.background.default, 0.9),
          borderRadius: 'inherit',
          zIndex: 1,
        };

      case 'component':
      default:
        return baseStyles;
    }
  };

  return (
    <Fade in={isVisible} timeout={300}>
      <Box 
        sx={getContainerStyles()} 
        onClick={variant === 'page' && onClose ? onClose : undefined}
      >
        {/* Simple loading spinner */}
        <Box
          sx={{
            animation: `${fadeInAnimation} 0.6s ease-out`,
          }}
        >
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: theme.palette.primary.main,
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
        </Box>

        {/* Loading Message */}
        {message && (
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textAlign: 'center',
              fontWeight: 500,
              maxWidth: 280,
              animation: `${fadeInAnimation} 0.6s ease-out 0.2s both`,
            }}
          >
            {message}
          </Typography>
        )}

        {/* Optional loading dots */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            animation: `${fadeInAnimation} 0.6s ease-out 0.4s both`,
          }}
        >
          {[0, 1, 2].map((index) => (
            <Box
              key={index}
              sx={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
                animation: `${pulseAnimation} 1.5s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Fade>
  );
};

// Export variants for different use cases
export const PageLoadingScreen: React.FC<Omit<EnhancedLoadingScreenProps, 'variant'>> = (props) => (
  <EnhancedLoadingScreen variant="page" {...props} />
);

export const OverlayLoadingScreen: React.FC<Omit<EnhancedLoadingScreenProps, 'variant'>> = (props) => (
  <EnhancedLoadingScreen variant="overlay" {...props} />
);

export const ComponentLoadingScreen: React.FC<Omit<EnhancedLoadingScreenProps, 'variant'>> = (props) => (
  <EnhancedLoadingScreen variant="component" {...props} />
);

export default EnhancedLoadingScreen;
