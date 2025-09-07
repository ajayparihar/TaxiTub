// TaxiTub Module: Theme Utilities
// Version: v1.0.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Purpose: Utility functions for consistent theme access and styling

import { Theme } from '@mui/material/styles';
import { alpha } from '../theme';

/**
 * Get spacing value from theme
 */
export const getSpacing = (theme: Theme, multiplier: number = 1): string => {
  return theme.spacing(multiplier);
};

/**
 * Get consistent border radius from theme
 */
export const getBorderRadius = (theme: Theme, size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): string => {
  const radiusMap = {
    xs: '6px',
    sm: '8px', 
    md: `${theme.shape.borderRadius}px`,
    lg: '16px',
    xl: '24px'
  };
  return radiusMap[size];
};

/**
 * Get consistent shadow from theme based on context
 */
export const getShadow = (theme: Theme, type: 'card' | 'cardHover' | 'button' | 'buttonHover' | 'focus'): string => {
  const isDark = theme.palette.mode === 'dark';
  
  switch (type) {
    case 'card':
      return isDark 
        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(17, 24, 39, 0.06)';
    case 'cardHover':
      return isDark
        ? '0 6px 16px rgba(0, 0, 0, 0.4)'
        : '0 6px 16px rgba(17, 24, 39, 0.08)';
    case 'button':
      return isDark
        ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
        : `0 2px 8px ${alpha(theme.palette.primary.main, 0.20)}`;
    case 'buttonHover':
      return isDark
        ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
        : `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`;
    case 'focus':
      return `0 0 0 3px ${alpha(theme.palette.primary.main, 0.3)}`;
    default:
      return 'none';
  }
};

/**
 * Get consistent colors for status indicators
 */
export const getStatusColor = (theme: Theme, status: 'success' | 'error' | 'warning' | 'info' | 'active' | 'empty' | 'offline'): string => {
  switch (status) {
    case 'success':
      return theme.palette.success.main;
    case 'error':
      return theme.palette.error.main;
    case 'warning':
      return theme.palette.warning.main;
    case 'info':
      return theme.palette.info.main;
    case 'active':
      return theme.palette.primary.main;
    case 'empty':
      return theme.palette.text.disabled;
    case 'offline':
      return theme.palette.error.main;
    default:
      return theme.palette.text.primary;
  }
};

/**
 * Get consistent background colors with proper alpha for overlays
 */
export const getBackgroundColor = (theme: Theme, variant: 'default' | 'paper' | 'surface' | 'muted' | 'overlay'): string => {
  switch (variant) {
    case 'default':
      return theme.palette.background.default;
    case 'paper':
      return theme.palette.background.paper;
    case 'surface':
      return theme.palette.background.paper;
    case 'muted':
      return alpha(theme.palette.text.primary, 0.04);
    case 'overlay':
      return alpha(theme.palette.background.paper, 0.95);
    default:
      return theme.palette.background.default;
  }
};

/**
 * Get consistent text colors based on context
 */
export const getTextColor = (theme: Theme, variant: 'primary' | 'secondary' | 'disabled' | 'contrast'): string => {
  switch (variant) {
    case 'primary':
      return theme.palette.text.primary;
    case 'secondary':
      return theme.palette.text.secondary;
    case 'disabled':
      return theme.palette.text.disabled;
    case 'contrast':
      return theme.palette.primary.contrastText;
    default:
      return theme.palette.text.primary;
  }
};

/**
 * Get responsive breakpoint values
 */
export const getBreakpoint = (theme: Theme, breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number => {
  return theme.breakpoints.values[breakpoint];
};

/**
 * Create consistent hover states
 */
export const createHoverState = (theme: Theme, baseColor?: string) => {
  const color = baseColor || theme.palette.text.primary;
  return {
    backgroundColor: alpha(color, 0.04),
    '&:hover': {
      backgroundColor: alpha(color, 0.08),
    },
  };
};

/**
 * Create consistent focus states
 */
export const createFocusState = (theme: Theme) => {
  return {
    '&:focus': {
      outline: 'none',
      boxShadow: getShadow(theme, 'focus'),
    },
    '&.Mui-focusVisible': {
      boxShadow: getShadow(theme, 'focus'),
    },
  };
};

/**
 * Utility for consistent transition timing
 */
export const getTransition = (properties: string[] = ['all'], duration: number = 200) => {
  return properties.map(prop => `${prop} ${duration}ms ease-in-out`).join(', ');
};

/**
 * Get consistent font weights
 */
export const getFontWeight = (variant: 'light' | 'regular' | 'medium' | 'semibold' | 'bold'): number => {
  const weights = {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  };
  return weights[variant];
};

/**
 * Create consistent elevation styles
 */
export const createElevation = (theme: Theme, level: number = 1) => {
  return {
    boxShadow: getShadow(theme, level > 1 ? 'cardHover' : 'card'),
    transition: getTransition(['box-shadow']),
    '&:hover': {
      boxShadow: getShadow(theme, 'cardHover'),
    },
  };
};
