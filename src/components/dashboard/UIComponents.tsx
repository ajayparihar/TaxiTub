// TaxiTub Module: Dashboard UI Components
// Version: v0.1.0
// Last Updated: 2025-09-12
// Author: Code Enhancement Agent  
// Purpose: Reusable UI components for dashboard interfaces

import React, { ReactElement } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Stack,
  Grid,
  Fade,
} from '@mui/material';
import { statusColors, enhancedNeutral } from '../../theme';
import {
  DashboardTabsProps,
  DashboardGridProps,
  TabPanelProps,
} from './types';

/**
 * Tab Panel Component
 * 
 * Renders content for individual tabs with smooth fade-in animations.
 * Provides proper accessibility attributes and conditional rendering.
 * 
 * @param props - Tab panel configuration
 * @returns JSX element for the tab panel
 */
export const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      sx={{ mt: 3 }}
    >
      {value === index && (
        <Fade in timeout={300}>
          {children as ReactElement}
        </Fade>
      )}
    </Box>
  );
};

/**
 * Dashboard Tabs Component
 * 
 * Provides a comprehensive tabbed interface for dashboard content organization.
 * Supports icons, badges, scrollable tabs, and responsive design.
 * 
 * Features:
 * - Scrollable tabs on smaller screens
 * - Badge indicators for tab content
 * - Icon support for visual identification
 * - Smooth animations between tab switches
 * - Accessibility compliance with proper ARIA attributes
 * 
 * @param props - Tabs configuration including tab data and event handlers
 * @returns JSX element for the complete tabbed interface
 */
export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  defaultTab = 0,
  onChange,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  /**
   * Handles tab selection changes with external callback support
   * @param _ - React synthetic event (unused)
   * @param newValue - Index of the newly selected tab
   */
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    onChange?.(newValue);
  };

  return (
    <Box>
      {/* Tab Navigation Header */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          '& .MuiTab-root': {
            minHeight: 48,
            textTransform: 'none',
            fontWeight: 500,
          },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={
              <TabLabel 
                icon={tab.icon}
                label={tab.label}
                badge={tab.badge}
              />
            }
            disabled={tab.disabled || false}
          />
        ))}
      </Tabs>

      {/* Tab Content Panels */}
      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};

/**
 * Tab Label Component
 * 
 * Renders the content of individual tab labels with consistent styling.
 * Supports icons, text, and badge indicators.
 * 
 * @param props - Tab label configuration
 * @returns JSX element for the tab label
 */
interface TabLabelProps {
  icon?: React.ReactNode;
  label: string;
  badge?: number | undefined;
}

const TabLabel: React.FC<TabLabelProps> = ({ icon, label, badge }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    {icon}
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <Badge
        badgeContent={badge}
        max={99}
        sx={{
          '& .MuiBadge-badge': {
            position: 'static',
            transform: 'none',
            backgroundColor: statusColors.badgeActive,
            color: enhancedNeutral[50],
            fontWeight: 600,
            fontSize: '0.7rem'
          },
        }}
      />
    )}
  </Stack>
);

/**
 * Dashboard Grid Component
 * 
 * Provides a responsive grid layout system for dashboard content organization.
 * Automatically handles responsive breakpoints and flexible column configurations.
 * 
 * Features:
 * - Responsive breakpoint support (xs, sm, md, lg, xl)
 * - Flexible column configuration per breakpoint
 * - Consistent spacing and alignment
 * - Automatic flex layout for child components
 * - Configurable minimum height constraints
 * 
 * @param props - Grid configuration including children, spacing, and column layout
 * @returns JSX element for the responsive grid system
 */
export const DashboardGrid: React.FC<DashboardGridProps> = ({
  children,
  spacing = 3,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  minHeight,
}) => {
  return (
    <Grid
      container
      spacing={spacing}
      sx={{
        minHeight,
        '& > .MuiGrid-item': {
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <Grid
          item
          key={index}
          xs={12 / (columns.xs || 1)}
          sm={12 / (columns.sm || 2)}
          md={12 / (columns.md || 3)}
          lg={12 / (columns.lg || 4)}
          xl={12 / (columns.xl || columns.lg || 4)}
        >
          {child}
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Dashboard Spacing Utilities
 * 
 * Provides consistent spacing values for dashboard layouts.
 * Ensures uniform spacing across all dashboard components.
 */
export const DASHBOARD_SPACING = {
  /** Small spacing for compact layouts */
  small: 1,
  /** Medium spacing for standard layouts */
  medium: 3,
  /** Large spacing for spacious layouts */
  large: 5,
} as const;

/**
 * Dashboard Animation Presets
 * 
 * Standardized animation timing for consistent user experience.
 */
export const DASHBOARD_ANIMATIONS = {
  /** Fast transitions for immediate feedback */
  fast: 150,
  /** Standard transitions for most interactions */
  standard: 300,
  /** Slow transitions for complex layout changes */
  slow: 500,
} as const;
