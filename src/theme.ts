// TaxiTub Module: Material-UI Theme Configuration (Soft-Flat, Warm Minimalist)
// Version: v0.2.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Refactored to warm light theme with soft-flat design, modular tokens, and accessible focus states

import { alpha, createTheme } from "@mui/material/styles";

// =========================
// Warm Minimalist Design Tokens
// =========================

// Core palette tokens (soft, warm, light)
const BASE = {
  bgApp: "#FAF9F6",     // Light background across all views
  bgCard: "#FFFFFF",    // Card and surfaces
  bgMuted: "#F5F5F5",   // Subtle containers and inputs
  border: "#EAEAEA",    // Soft borders
  primary: "#F47C24",   // Warm orange accent
  primaryHover: "#E16E1C",
  textStrong: "#333333", // Headings
  textBody: "#666666",   // Body text
  success: "#4CAF50",    // Soft green (success)
  error: "#F44336",      // Soft red (error)
  info: "#1E88E5",       // Subtle blue for info (optional)
  warning: "#FB8C00",    // Soft orange for warning (optional)
};

// Dark palette tokens
const BASE_DARK = {
  bgApp: "#121212",
  bgCard: "#1E1E1E",
  bgMuted: "#2A2A2A",
  border: "#2F2F2F",
  primary: "#F47C24",
  primaryHover: "#E16E1C",
  textStrong: "#EDEDED",
  textBody: "#B0B0B0",
  success: "#4CAF50",
  error: "#F44336",
  info: "#64B5F6",
  warning: "#FFB74D",
};

// Shadows (subtle, non-harsh)
const SHADOWS = {
  card: "0 2px 8px rgba(17, 24, 39, 0.06)",
  cardHover: "0 6px 16px rgba(17, 24, 39, 0.08)",
  button: "0 2px 8px rgba(244, 124, 36, 0.20)",
  buttonHover: "0 4px 12px rgba(244, 124, 36, 0.25)",
  focus: `0 0 0 3px ${alpha(BASE.primary, 0.30)}`,
};

// 8px spacing scale
const designTokens = {
  spacing: {
    unit: 8,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: "50%",
  },
  shadows: SHADOWS,
};

// Backwards-compatible exports (some modules may import these)
const primary = {
  300: "#FDB079",
  400: "#F99045",
  500: BASE.primary,
  600: BASE.primaryHover,
  700: "#C95F13",
};
const accent = { 500: BASE.primary };
const neutral = {
  50: "#FFFFFF",
  100: BASE.bgApp,
  200: "#F3F2ED",
  300: "#ECEBE7",
  400: "#E6E4DF",
  500: "#DAD7D2",
  600: "#CFCBC6",
  700: "#BDB8B3",
  800: "#A39D98",
  900: "#807A75",
};
const success = { 500: BASE.success } as const;
const error = { 500: BASE.error } as const;
const warning = { 500: BASE.warning } as const;
const info = { 500: BASE.info } as const;

// Backward-compat: map old enhancedNeutral keys to new light theme values
const enhancedNeutral = {
  50: "#FFFFFF",   // text on colored badges/surfaces
  350: BASE.textBody,  // secondary text on light backgrounds
  450: "#9E9E9E",  // disabled text
} as const;

const statusColors = {
  queueActive: BASE.primary,
  queueEmpty: "#BDBDBD",
  queueFull: BASE.warning,
  queueOffline: BASE.error,
  systemOnline: BASE.success,
  systemOffline: BASE.error,
  systemMaintenance: BASE.warning,
  badgeActive: BASE.primary,
  badgeEmpty: "#BDBDBD",
  badgeInfo: BASE.info,
  badgeWarning: BASE.warning,
  badgeError: BASE.error,
  textOnDark: "#FFFFFF",
  textOnLight: BASE.textStrong,
  textSecondary: BASE.textBody,
  textDisabled: "#9E9E9E",
};

const buildTheme = (mode: 'light' | 'dark') => {
  const M = mode === 'light' ? BASE : BASE_DARK;
  return createTheme({
    palette: {
      mode,
      primary: {
        main: M.primary,
        light: mode === 'light' ? "#F99D55" : alpha(M.primary, 0.85),
        dark: M.primaryHover,
        contrastText: "#FFFFFF",
      },
      success: { main: M.success, contrastText: "#FFFFFF" },
      error: { main: M.error, contrastText: "#FFFFFF" },
      warning: { main: M.warning, contrastText: mode === 'light' ? M.textStrong : "#000000" },
      info: { main: M.info, contrastText: "#FFFFFF" },
      background: { default: M.bgApp, paper: M.bgCard },
      text: { primary: M.textStrong, secondary: M.textBody, disabled: mode === 'light' ? "#9E9E9E" : "#6B6B6B" },
      divider: M.border,
      action: {
        hover: alpha(M.textStrong, 0.04),
        selected: alpha(M.primary, 0.12),
        disabled: alpha(mode === 'light' ? "#9E9E9E" : "#6B6B6B", 0.4),
        focus: alpha(M.primary, 0.30),
      },
    },
    shape: { borderRadius: designTokens.borderRadius.md },
    typography: {
      fontFamily: [
        "Roboto",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Arial",
        "sans-serif",
      ].join(","),
      h1: { fontWeight: 700, color: M.textStrong },
      h2: { fontWeight: 700, color: M.textStrong },
      h3: { fontWeight: 700, color: M.textStrong },
      h4: { fontWeight: 700, color: M.textStrong },
      h5: { fontWeight: 700, color: M.textStrong },
      h6: { fontWeight: 700, color: M.textStrong },
      body1: { color: M.textBody },
      body2: { color: M.textBody },
      button: { textTransform: "none", fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: M.bgApp,
            color: M.textBody,
            backgroundImage: "none",
          },
          "*::-webkit-scrollbar": { width: 8, height: 8 },
          "*::-webkit-scrollbar-track": { background: "transparent" },
          "*::-webkit-scrollbar-thumb": {
            background: alpha(M.primary, 0.3),
            borderRadius: 8,
            transition: "background-color 0.2s ease",
          },
          "*::-webkit-scrollbar-thumb:hover": {
            background: alpha(M.primary, 0.5),
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: M.bgCard,
            backgroundImage: "none",
            color: M.textStrong,
            borderBottom: `1px solid ${M.border}`,
            boxShadow: mode === 'light' 
              ? `0 2px 8px ${alpha(M.primary, 0.04)}, 0 1px 3px ${alpha("#000", 0.03)}`
              : `0 2px 8px ${alpha("#000", 0.2)}, 0 1px 3px ${alpha("#000", 0.1)}`,
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: M.bgCard,
            border: `1px solid ${M.border}`,
            boxShadow: SHADOWS.card,
            borderRadius: designTokens.borderRadius.md,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: M.bgCard,
            border: `1px solid ${M.border}`,
            boxShadow: SHADOWS.card,
            borderRadius: designTokens.borderRadius.md,
            "&:hover": { boxShadow: SHADOWS.cardHover },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: designTokens.borderRadius.md, fontWeight: 600, padding: "10px 20px" },
          containedPrimary: {
            backgroundColor: M.primary,
            boxShadow: SHADOWS.button,
            "&:hover": { backgroundColor: M.primaryHover, boxShadow: SHADOWS.buttonHover },
            "&.Mui-focusVisible": { boxShadow: SHADOWS.focus },
          },
          outlined: {
            borderColor: M.border,
            "&:hover": { borderColor: M.primary },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: M.bgCard,
              borderRadius: designTokens.borderRadius.sm,
              "& fieldset": { borderColor: M.border },
              "&:hover fieldset": { borderColor: alpha(M.textStrong, 0.3) },
              "&.Mui-focused fieldset": { borderColor: M.primary },
              "&.Mui-focused": { boxShadow: SHADOWS.focus },
              "& input": { color: M.textStrong, '::placeholder': { color: M.textBody, opacity: 1 } },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: designTokens.borderRadius.sm,
            backgroundColor: M.bgMuted,
            color: M.textStrong,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: M.bgCard,
            borderRadius: designTokens.borderRadius.lg,
            border: `1px solid ${M.border}`,
            boxShadow: SHADOWS.cardHover,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { 
            borderRadius: designTokens.borderRadius.sm, 
            backgroundColor: 'transparent',
            '&.Mui-focusVisible': { boxShadow: SHADOWS.focus },
            '&:hover': {
              backgroundColor: alpha(M.textStrong, 0.04),
            }
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: M.bgCard,
            borderRadius: 0,
            border: 'none',
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-root": { backgroundColor: M.bgMuted, color: M.textStrong, fontWeight: 600 },
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            "& .MuiAlert-root": {
              backgroundColor: M.bgCard,
              color: M.textStrong,
              border: `1px solid ${M.border}`,
              boxShadow: SHADOWS.card,
            },
          },
        },
      },
    },
  });
};

export const getTheme = (mode: 'light' | 'dark' = 'light') => buildTheme(mode);
export const theme = getTheme('light');

// Exports for other modules
export { designTokens, primary, accent, neutral, success, error, warning, info, statusColors, enhancedNeutral };
export { alpha } from "@mui/material/styles";
