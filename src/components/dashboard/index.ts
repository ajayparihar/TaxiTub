// TaxiTub Module: Dashboard Components Index
// Version: v0.1.0
// Last Updated: 2025-09-12
// Author: Code Enhancement Agent
// Purpose: Centralized exports for dashboard component module

/**
 * Dashboard Components Module
 * 
 * This module provides a comprehensive set of reusable dashboard components
 * with a focus on modularity, type safety, and consistent user experience.
 * 
 * Architecture:
 * - Types: Centralized type definitions for all dashboard components
 * - UI Components: Reusable UI elements with focused responsibilities
 * - Layout Components: Higher-level layout and organization components
 * 
 * Features:
 * - Full TypeScript support with comprehensive type definitions
 * - Responsive design with Material-UI integration
 * - Accessibility compliance (WCAG guidelines)
 * - Consistent theming and animation patterns
 * - Modular architecture for easy maintenance and testing
 */

// Type definitions
export type {
  WidgetAction,
  DashboardWidgetProps,
  DashboardTab,
  DashboardTabsProps,
  DashboardGridProps,
  StatCardProps,
  ActivityItem,
  ActivityFeedProps,
  BreadcrumbItem,
  DashboardAction,
  DashboardLayoutProps,
  TabPanelProps,
} from './types';

// UI Components
export {
  TabPanel,
  DashboardTabs,
  DashboardGrid,
  DASHBOARD_SPACING,
  DASHBOARD_ANIMATIONS,
} from './UIComponents';

/**
 * Re-exports from the main Dashboard component
 * These will be imported from the refactored Dashboard.tsx file
 */
// Note: These exports will be uncommented once Dashboard.tsx is refactored
// export {
//   DashboardWidget,
//   StatCard,
//   ActivityFeed,
//   DashboardLayout,
// } from '../Dashboard';

/**
 * Usage Examples:
 * 
 * ```typescript
 * import {
 *   DashboardTabs,
 *   DashboardGrid,
 *   DashboardWidget,
 *   type DashboardTab
 * } from './components/dashboard';
 * 
 * const tabs: DashboardTab[] = [
 *   {
 *     label: 'Overview',
 *     icon: <DashboardIcon />,
 *     content: <DashboardOverview />
 *   },
 *   {
 *     label: 'Analytics',
 *     badge: 5,
 *     content: <AnalyticsPanel />
 *   }
 * ];
 * 
 * return (
 *   <DashboardGrid columns={{ xs: 1, md: 2, lg: 3 }}>
 *     <DashboardWidget title="Quick Stats">
 *       <DashboardTabs tabs={tabs} />
 *     </DashboardWidget>
 *   </DashboardGrid>
 * );
 * ```
 */
