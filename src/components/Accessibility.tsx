// TaxiTub Module: Accessibility Components
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: ARIA labels, keyboard navigation, and focus management

import React, { useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";
import { BaseComponentProps } from "../types";

/**
 * Screen reader only text component
 */
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <Box
    component="span"
    sx={{
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: 0,
      margin: "-1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: 0,
    }}
  >
    {children}
  </Box>
);

/**
 * Skip link component for keyboard navigation
 */
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  const theme = useTheme();
  
  return (
    <Box
      component="a"
      href={href}
      sx={{
        position: "absolute",
        top: -40,
        left: 6,
        zIndex: 10000,
        padding: "8px 16px",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        textDecoration: "none",
        borderRadius: 1,
        fontSize: "0.875rem",
        fontWeight: 600,
        "&:focus": {
          top: 6,
        },
        "&:focus-visible": {
          top: 6,
          outline: `2px solid ${theme.palette.common.white}`,
          outlineOffset: "2px",
        },
      }}
    >
      {children}
    </Box>
  );
};

/**
 * Focus trap component
 */
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
  autoFocus?: boolean;
}> = ({ children, enabled = true, autoFocus = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusableRef.current = firstFocusable || null;
    lastFocusableRef.current = lastFocusable || null;

    if (autoFocus && firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [enabled, autoFocus]);

  return (
    <Box ref={containerRef} tabIndex={-1}>
      {children}
    </Box>
  );
};

/**
 * Accessible status announcer for dynamic content changes
 */
export const LiveRegion: React.FC<{
  message: string;
  priority?: "polite" | "assertive";
  clearAfter?: number;
}> = ({ message, priority = "polite", clearAfter = 5000 }) => {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter && message) {
      const timer = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);
      
      return () => clearTimeout(timer);
    }
    return;
  }, [message, clearAfter]);

  return (
    <Box
      component="div"
      aria-live={priority}
      aria-atomic="true"
      sx={{
        position: "absolute",
        left: "-10000px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      {currentMessage}
    </Box>
  );
};

/**
 * Enhanced focus indicator component
 */
export const FocusVisible: React.FC<
  BaseComponentProps & {
    children: (focusProps: {
      onFocus: () => void;
      onBlur: () => void;
      "data-focus-visible"?: boolean;
    }) => React.ReactNode;
  }
> = ({ children, className }) => {
  const [focused, setFocused] = React.useState(false);

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleMouseDown = () => {
    setFocused(false);
  };

  return (
    <Box className={className} onMouseDown={handleMouseDown}>
      {children({
        onFocus: handleFocus,
        onBlur: handleBlur,
      ...(focused && { "data-focus-visible": true }),
      })}
    </Box>
  );
};

/**
 * Accessible progress indicator
 */
export const ProgressIndicator: React.FC<{
  value?: number; // 0-100
  max?: number;
  label: string;
  description?: string;
  indeterminate?: boolean;
}> = ({ 
  value = 0, 
  max = 100, 
  label, 
  description,
  indeterminate = false 
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="body2" id="progress-label">
          {label}
        </Typography>
        {!indeterminate && (
          <Typography variant="body2" color="text.secondary">
            {Math.round(percentage)}%
          </Typography>
        )}
      </Box>
      
      <Box
        role="progressbar"
        aria-labelledby="progress-label"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={indeterminate ? "Loading..." : `${Math.round(percentage)}%`}
        sx={{
          width: "100%",
          height: 8,
          backgroundColor: 'action.disabledBackground',
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            backgroundColor: "primary.main",
            width: indeterminate ? "100%" : `${percentage}%`,
            transition: indeterminate ? "none" : "width 0.3s ease",
            ...(indeterminate && {
              animation: "progressIndeterminate 2s linear infinite",
              "@keyframes progressIndeterminate": {
                "0%": { transform: "translateX(-100%)" },
                "100%": { transform: "translateX(100%)" },
              },
            }),
          }}
        />
      </Box>
      
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {description}
        </Typography>
      )}
    </Box>
  );
};

/**
 * Keyboard shortcuts helper
 */
export const useKeyboardShortcuts = (
  shortcuts: Record<string, () => void>,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && "ctrl",
        event.altKey && "alt", 
        event.shiftKey && "shift",
        event.metaKey && "meta",
        event.key.toLowerCase()
      ].filter(Boolean).join("+");

      const handler = shortcuts[key];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
};

/**
 * Accessible tooltip with keyboard support
 */
export const AccessibleTooltip: React.FC<{
  content: string;
  children: React.ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
}> = ({ content, children, placement = "top" }) => {
  const [open, setOpen] = React.useState(false);
  const tooltipId = React.useId();
  const theme = useTheme();

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleFocus = () => {
    handleOpen();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  const positionStyles = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  };

  return (
    <Box
      sx={{ position: "relative", display: "inline-block" }}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleFocus}
      onBlur={handleClose}
      onKeyDown={handleKeyDown}
    >
      {React.cloneElement(children, {
        "aria-describedby": open ? tooltipId : undefined,
        tabIndex: children.props.tabIndex || 0,
      })}
      
      <Fade in={open}>
        <Box
          id={tooltipId}
          role="tooltip"
          sx={{
            position: "absolute",
            zIndex: theme.zIndex.tooltip,
            px: 1.5,
            py: 1,
            backgroundColor: alpha(theme.palette.grey[800], 0.95),
            color: theme.palette.common.white,
            borderRadius: 1,
            fontSize: "0.75rem",
            maxWidth: 200,
            wordWrap: "break-word",
            pointerEvents: "none",
            ...positionStyles[placement],
          }}
        >
          {content}
        </Box>
      </Fade>
    </Box>
  );
};
