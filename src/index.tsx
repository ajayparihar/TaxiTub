// TaxiTub Module: Application Entry Point
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: React 18 application entry point with theme provider and strict mode

/**
 * TaxiTub Application Entry Point
 * 
 * This file bootstraps the entire TaxiTub React application and sets up:
 * - React 18 root rendering with createRoot API
 * - Material-UI theme provider with custom glassmorphic theme
 * - CSS baseline for consistent styling across browsers
 * - Font loading for Roboto font family
 * - React StrictMode for development warnings and future compatibility
 * 
 * Architecture:
 * 1. Font Loading - Preload Roboto font weights for performance
 * 2. Root Element - Create React 18 root for concurrent features
 * 3. Theme Provider - Apply custom Material-UI theme
 * 4. CSS Baseline - Reset and normalize browser styles
 * 5. App Component - Mount main application component
 * 
 * Performance Considerations:
 * - Uses React 18 createRoot for concurrent rendering
 * - Preloads font files to prevent flash of unstyled text (FOUT)
 * - Applies CSS baseline for consistent cross-browser appearance
 * - Enables StrictMode for detecting side effects and deprecated patterns
 * 
 * @see https://react.dev/reference/react-dom/client/createRoot
 * @see https://mui.com/material-ui/customization/theming/
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Theme mode provider (light/dark)
import { ThemeModeProvider } from "./components/ThemeModeProvider";

// Font loading for Roboto typeface (Material-UI default)
// Loading multiple weights to support typography hierarchy
import "@fontsource/roboto/300.css"; // Light weight for subtitles and captions
import "@fontsource/roboto/400.css"; // Regular weight for body text
import "@fontsource/roboto/500.css"; // Medium weight for buttons and labels
import "@fontsource/roboto/700.css"; // Bold weight for headings

// ========================================
// APPLICATION BOOTSTRAP
// ========================================

/**
 * Create React 18 root for concurrent features and improved performance.
 * The createRoot API replaces the legacy ReactDOM.render method and enables
 * React 18 features like automatic batching and concurrent rendering.
 */
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

/**
 * Render the application with all necessary providers and wrappers.
 * 
 * Component Hierarchy:
 * 1. React.StrictMode - Development mode enhancements and warnings
 * 2. ThemeProvider - Material-UI theme context for styled components
 * 3. CssBaseline - Browser CSS reset and normalization
 * 4. App - Main application component with routing and state management
 */
root.render(
  <React.StrictMode>
    <ThemeModeProvider>
      <App />
    </ThemeModeProvider>
  </React.StrictMode>,
);
