// TaxiTub Module: Premium Loading Screen
// Version: v1.0.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Beautiful, modern loading screen with full theme support and smooth animations

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Fade,
  Zoom,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import { useThemeMode } from './ThemeModeProvider';

// Advanced animations
const rotateAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulseGlowAnimation = keyframes`
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
`;

const waveAnimation = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`;

interface PremiumLoadingScreenProps {
  message?: string;
  variant?: 'page' | 'component' | 'overlay';
  fullHeight?: boolean;
  showLogo?: boolean;
  delayMs?: number;
  size?: 'small' | 'medium' | 'large';
}

const PremiumLoadingScreen: React.FC<PremiumLoadingScreenProps> = ({
  message = 'Loading...',
  variant = 'component',
  fullHeight = true,
  showLogo = true,
  delayMs = 100,
  size = 'medium',
}) => {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // Delay showing loading to prevent flicker on fast loads
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Simulate progress for visual feedback
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Size configurations
  const sizeConfig = {
    small: { spinner: 40, logo: 32, container: 200 },
    medium: { spinner: 60, logo: 48, container: 280 },
    large: { spinner: 80, logo: 64, container: 360 },
  };

  const config = sizeConfig[size];

  // Dynamic container styles based on variant
  const getContainerStyles = () => {
    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minHeight: fullHeight ? '60vh' : 'auto',
      py: 4,
      px: 2,
      position: 'relative' as const,
      overflow: 'hidden' as const,
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
          // Beautiful gradient background
          background: mode === 'light' 
            ? `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.02)} 50%, ${theme.palette.background.paper} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 50%, ${theme.palette.background.paper} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === 'light'
              ? `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 50%)`
              : `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 50%),
                 radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 50%)`,
            pointerEvents: 'none',
          },
        };

      case 'overlay':
        return {
          ...baseStyles,
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: alpha(theme.palette.background.default, 0.95),
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 'inherit',
          zIndex: 1,
        };

      case 'component':
      default:
        return {
          ...baseStyles,
          maxWidth: config.container,
          mx: 'auto',
        };
    }
  };

  // TaxiTub Logo Component
  const TaxiTubLogo: React.FC<{ size: number }> = ({ size }) => (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        fontWeight: 'bold',
        fontSize: size * 0.3,
        boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        animation: `${pulseGlowAnimation} 2s ease-in-out infinite`,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          backgroundSize: '300% 300%',
          animation: `${gradientAnimation} 3s ease infinite`,
          zIndex: -1,
          filter: 'blur(4px)',
          opacity: 0.7,
        },
      }}
    >
      T
    </Box>
  );

  // Modern Spinner Component
  const ModernSpinner: React.FC<{ size: number }> = ({ size }) => (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      {/* Main spinning ring */}
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderTopColor: theme.palette.primary.main,
          animation: `${rotateAnimation} 1s linear infinite`,
          position: 'absolute',
        }}
      />
      
      {/* Secondary spinning ring */}
      <Box
        sx={{
          width: size * 0.75,
          height: size * 0.75,
          borderRadius: '50%',
          border: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
          borderRightColor: theme.palette.secondary.main,
          animation: `${rotateAnimation} 1.5s linear infinite reverse`,
          position: 'absolute',
          top: '12.5%',
          left: '12.5%',
        }}
      />
      
      {/* Inner glow */}
      <Box
        sx={{
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
          position: 'absolute',
          top: '30%',
          left: '30%',
          animation: `${pulseGlowAnimation} 2s ease-in-out infinite`,
        }}
      />
    </Box>
  );

  // Progress indicator dots
  const ProgressDots: React.FC = () => (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: theme.palette.primary.main,
            animation: `${waveAnimation} 1.4s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`,
          }}
        />
      ))}
    </Box>
  );

  // Progress bar component
  const ProgressBar: React.FC = () => (
    <Box
      sx={{
        width: '100%',
        maxWidth: 200,
        height: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          width: `${Math.min(progress, 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          borderRadius: 1,
          transition: 'width 0.3s ease',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.4)}, transparent)`,
            animation: `${shimmerAnimation} 1.5s ease-in-out infinite`,
          },
        }}
      />
    </Box>
  );

  return (
    <Fade in={isVisible} timeout={400}>
      <Box sx={getContainerStyles()}>
        {/* Main content */}
        <Zoom in={isVisible} timeout={600} style={{ transitionDelay: '200ms' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo or Spinner */}
            {showLogo ? (
              <TaxiTubLogo size={config.logo} />
            ) : (
              <ModernSpinner size={config.spinner} />
            )}

            {/* Loading Message */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant={size === 'large' ? 'h6' : 'body1'}
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  textAlign: 'center',
                  maxWidth: config.container * 0.8,
                  lineHeight: 1.4,
                  animation: `${pulseGlowAnimation} 2s ease-in-out infinite`,
                }}
              >
                {message}
              </Typography>

              {/* Progress dots */}
              <ProgressDots />
              
              {/* Progress bar for page variant */}
              {variant === 'page' && <ProgressBar />}
            </Box>

            {/* Additional visual elements for page variant */}
            {variant === 'page' && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  mt: 1,
                  opacity: 0.8,
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                Please wait...
              </Typography>
            )}
          </Box>
        </Zoom>
      </Box>
    </Fade>
  );
};

// Export variants for different use cases
export const PageLoadingScreen: React.FC<Omit<PremiumLoadingScreenProps, 'variant'>> = (props) => (
  <PremiumLoadingScreen variant="page" {...props} />
);

export const OverlayLoadingScreen: React.FC<Omit<PremiumLoadingScreenProps, 'variant'>> = (props) => (
  <PremiumLoadingScreen variant="overlay" {...props} />
);

export const ComponentLoadingScreen: React.FC<Omit<PremiumLoadingScreenProps, 'variant'>> = (props) => (
  <PremiumLoadingScreen variant="component" {...props} />
);

export default PremiumLoadingScreen;
