// TaxiTub: Theme Mode Provider (light/dark)
// Version: v0.1.0
// Last Updated: 2025-09-07
// Author: AI Agent

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../theme";

export type ThemeMode = "light" | "dark";

interface ThemeModeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);
const STORAGE_KEY = "taxitub_theme";

/**
 * Provides Material-UI theme and light/dark mode with localStorage persistence.
 * Exposes toggle and setter via useThemeMode hook.
 */
export const ThemeModeProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const getInitialMode = (): ThemeMode => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "light" || stored === "dark") return stored;
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    } catch {
      return "light";
    }
  };

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const initialMode = getInitialMode();
    // Set initial data-theme attribute
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initialMode);
    }
    return initialMode;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      // Set data-theme attribute on document element for CSS custom properties
      document.documentElement.setAttribute('data-theme', mode);
    } catch {}
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);
  const toggleMode = () => setModeState((prev) => (prev === "light" ? "dark" : "light"));

  const theme = useMemo(() => getTheme(mode), [mode]);

  const value: ThemeModeContextValue = useMemo(() => ({ mode, toggleMode, setMode }), [mode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

/**
 * Hook to access theme mode state and controls.
 * Must be used within ThemeModeProvider.
 */
export const useThemeMode = (): ThemeModeContextValue => {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
};

