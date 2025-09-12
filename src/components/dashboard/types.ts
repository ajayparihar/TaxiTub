// TaxiTub Module: Dashboard Type Definitions
// Version: v0.1.0
// Last Updated: 2025-09-12
// Author: Code Enhancement Agent
// Purpose: Centralized type definitions for all dashboard-related components

import { ReactNode } from 'react';

/**
 * Dashboard Widget Action Configuration
 * 
 * Defines the structure for action buttons that can be displayed in widget headers.
 * These actions provide interactive functionality for dashboard widgets.
 */
export interface WidgetAction {
  /** Display text for the action button */
  label: string;
  /** Optional icon to display alongside the action */
  icon?: ReactNode;
  /** Handler function executed when the action is triggered */
  onClick: () => void;
  /** Whether the action is disabled and cannot be executed */
  disabled?: boolean;
}

/**
 * Dashboard Widget Configuration
 * 
 * Core interface defining all properties and behavior options for dashboard widgets.
 * Provides comprehensive customization for layout, interaction, and visual presentation.
 */
export interface DashboardWidgetProps {
  /** Primary widget title displayed in the header */
  title: string;
  /** Optional secondary text displayed below the title */
  subtitle?: string;
  /** Widget content to render in the main area */
  children: ReactNode;
  /** Optional array of action menu items for widget interactions */
  actions?: WidgetAction[];
  /** Whether widget is in loading state with progress indicators */
  loading?: boolean;
  /** Error message to display instead of content */
  error?: string;
  /** Whether widget should expand to fill available vertical space */
  fullHeight?: boolean;
  /** Whether widget content can be collapsed/expanded */
  collapsible?: boolean;
  /** Initial expansion state for collapsible widgets */
  defaultExpanded?: boolean;
  /** Whether to show refresh button in widget header */
  refreshable?: boolean;
  /** Handler for refresh button interactions */
  onRefresh?: () => void;
  /** Additional CSS classes for custom styling */
  className?: string;
  /** Predefined size variants affecting padding and typography */
  size?: 'small' | 'medium' | 'large';
}

/**
 * Dashboard Tab Configuration
 * 
 * Defines the structure for individual tabs within dashboard tab panels.
 * Supports icons, badges, and content organization.
 */
export interface DashboardTab {
  /** Display text for the tab */
  label: string;
  /** Optional icon to display in the tab */
  icon?: ReactNode;
  /** Optional numeric badge to show on the tab */
  badge?: number;
  /** Content to display when the tab is active */
  content: ReactNode;
  /** Whether the tab is disabled and cannot be selected */
  disabled?: boolean;
}

/**
 * Dashboard Tabs Component Properties
 * 
 * Configuration interface for the tabbed dashboard interface component.
 */
export interface DashboardTabsProps {
  /** Array of tab configurations */
  tabs: DashboardTab[];
  /** Index of the initially selected tab */
  defaultTab?: number;
  /** Callback fired when tab selection changes */
  onChange?: (tabIndex: number) => void;
}

/**
 * Dashboard Grid Layout Configuration
 * 
 * Defines responsive breakpoint configuration for dashboard grid layouts.
 * Supports Material-UI's responsive breakpoint system.
 */
export interface DashboardGridProps {
  /** Child components to render in the grid */
  children: ReactNode;
  /** Spacing between grid items */
  spacing?: number;
  /** Column configuration for different breakpoints */
  columns?: { 
    xs?: number; 
    sm?: number; 
    md?: number; 
    lg?: number; 
    xl?: number; 
  };
  /** Minimum height for the grid container */
  minHeight?: string;
}

/**
 * Statistical Card Component Properties
 * 
 * Configuration for dashboard statistical display cards showing key metrics.
 */
export interface StatCardProps {
  /** Title describing the statistic */
  title: string;
  /** The statistical value to display */
  value: string | number;
  /** Optional subtitle providing additional context */
  subtitle?: string;
  /** Optional icon to display alongside the statistic */
  icon?: ReactNode;
  /** Color theme for the card styling */
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  /** Optional trend information showing change over time */
  trend?: {
    /** Direction of the trend (up, down, or neutral) */
    direction: 'up' | 'down' | 'neutral';
    /** Formatted trend value (e.g., "+15%", "-3.2%") */
    value: string;
    /** Optional time period for the trend (e.g., "this week") */
    period?: string;
  };
  /** Whether the card is in loading state */
  loading?: boolean;
  /** Optional click handler for interactive statistics */
  onClick?: () => void;
}

/**
 * Activity Feed Item Configuration
 * 
 * Defines the structure for individual items in dashboard activity feeds.
 */
export interface ActivityItem {
  /** Unique identifier for the activity item */
  id: string;
  /** Visual type indicator affecting styling and icon selection */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Primary title describing the activity */
  title: string;
  /** Optional detailed description of the activity */
  description?: string;
  /** Timestamp when the activity occurred */
  timestamp: string;
  /** Optional custom icon for the activity */
  icon?: ReactNode;
  /** Optional avatar URL for the user associated with the activity */
  avatar?: string;
  /** Optional username for the user associated with the activity */
  user?: string;
}

/**
 * Activity Feed Component Properties
 * 
 * Configuration for dashboard activity feed components showing recent actions.
 */
export interface ActivityFeedProps {
  /** Array of activity items to display */
  activities: ActivityItem[];
  /** Whether the feed is in loading state */
  loading?: boolean;
  /** Message to display when no activities are available */
  emptyMessage?: string;
  /** Maximum number of items to display */
  maxItems?: number;
  /** Whether to show timestamps for each activity */
  showTimestamps?: boolean;
}

/**
 * Dashboard Layout Breadcrumb Item
 * 
 * Configuration for individual breadcrumb navigation items.
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string;
  /** Optional navigation URL */
  href?: string;
  /** Whether this is the current page breadcrumb */
  current?: boolean;
}

/**
 * Dashboard Layout Action Button
 * 
 * Configuration for action buttons in dashboard headers.
 */
export interface DashboardAction {
  /** Display text for the action button */
  label: string;
  /** Optional icon to display in the button */
  icon?: ReactNode;
  /** Handler function for button clicks */
  onClick: () => void;
  /** Button visual variant */
  variant?: 'text' | 'outlined' | 'contained';
  /** Button color theme */
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether the button is in loading state */
  loading?: boolean;
}

/**
 * Dashboard Layout Properties
 * 
 * Configuration for the main dashboard layout wrapper component.
 */
export interface DashboardLayoutProps {
  /** Main page title */
  title: string;
  /** Optional subtitle providing additional context */
  subtitle?: string;
  /** Optional breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional action buttons for the dashboard header */
  actions?: DashboardAction[];
  /** Child components to render in the dashboard body */
  children: ReactNode;
  /** Whether the dashboard is in loading state */
  loading?: boolean;
  /** Optional status indicator for the dashboard */
  status?: {
    /** Status label text */
    label: string;
    /** Status color theme */
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
  /** Optional additional content for the dashboard header */
  headerContent?: ReactNode;
}

/**
 * Tab Panel Properties
 * 
 * Internal configuration for tab panel components.
 */
export interface TabPanelProps {
  /** Content to display in the tab panel */
  children?: ReactNode;
  /** Index of this tab panel */
  index: number;
  /** Currently active tab index */
  value: number;
}
