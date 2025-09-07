// TaxiTub Module: Dashboard Layout System
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Reusable dashboard components with consistent layouts and responsive behavior

import React, { ReactNode, ReactElement, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Button,
  Tabs,
  Tab,
  Badge,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Fade,
  Grow,
  Collapse,
  LinearProgress,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { PageHeader } from './Layout';
import { statusColors, enhancedNeutral } from '../theme';

/**
 * Dashboard Widget Action - Represents an action button in widget header
 */
interface WidgetAction {
  label: string;           // Display text for the action
  icon?: ReactNode;       // Optional icon to display with action
  onClick: () => void;     // Handler for action click
  disabled?: boolean;      // Whether action is disabled
}

/**
 * Props for the DashboardWidget component
 * Defines a reusable, configurable card container for dashboard content
 */
interface DashboardWidgetProps {
  title: string;                           // Primary widget title
  subtitle?: string;                       // Optional secondary text below title
  children: ReactNode;                     // Widget content to render
  actions?: WidgetAction[];                // Optional action menu items
  loading?: boolean;                       // Whether widget is in loading state
  error?: string;                          // Error message to display instead of content
  fullHeight?: boolean;                    // Whether widget should fill available height
  collapsible?: boolean;                   // Whether widget can be collapsed/expanded
  defaultExpanded?: boolean;               // Initial expansion state for collapsible widgets
  refreshable?: boolean;                   // Whether to show refresh button
  onRefresh?: () => void;                  // Handler for refresh button click
  className?: string;                      // Additional CSS classes
  size?: 'small' | 'medium' | 'large';    // Predefined size variants affecting padding
}

/**
 * Reusable Dashboard Widget Component
 * Provides consistent layout, styling, and interactive features for dashboard cards
 * 
 * Features:
 * - Responsive sizing with predefined size variants
 * - Collapsible content with smooth animations
 * - Action menu with customizable buttons
 * - Loading states with progress indicators
 * - Error handling with retry mechanisms
 * - Hover effects and Material Design styling
 */
export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  subtitle,
  children,
  actions = [],
  loading = false,
  error,
  fullHeight = false,
  collapsible = false,
  defaultExpanded = true,
  refreshable = false,
  onRefresh,
  className,
  size = 'medium',
}) => {
  // State for collapsible functionality
  const [expanded, setExpanded] = useState(defaultExpanded);
  // State for action menu positioning
  const [actionAnchorEl, setActionAnchorEl] = useState<null | HTMLElement>(null);

  // Handlers for action menu dropdown
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setActionAnchorEl(event.currentTarget);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
  };

  // Dynamic styling based on props
  const cardHeight = fullHeight ? '100%' : 'auto';
  const padding = size === 'small' ? 2 : size === 'large' ? 4 : 3; // Responsive padding

  return (
    <Grow in timeout={300}>
      <Card
        sx={{
          height: cardHeight,
          display: 'flex',
          flexDirection: 'column',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        }}
        className={className || ''}
      >
        {/* Widget Header - Contains title, controls, and action buttons */}
        <Box sx={{ px: padding, pt: padding, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            {/* Title Section */}
            <Box sx={{ flex: 1, mr: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                {/* Collapsible toggle button */}
                {collapsible && (
                  <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ mr: 0.5 }}
                    aria-label={expanded ? 'Collapse widget' : 'Expand widget'}
                  >
                    {expanded ? <RemoveIcon /> : <MoreVertIcon />}
                  </IconButton>
                )}
                {/* Widget title with responsive typography */}
                <Typography
                  variant={size === 'small' ? 'subtitle2' : 'h6'}
                  sx={{ fontWeight: 600, lineHeight: 1.2 }}
                >
                  {title}
                </Typography>
                {/* Inline loading indicator */}
                {loading && <LinearProgress sx={{ width: 40, height: 2 }} />}
              </Stack>
              {subtitle && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Action Buttons Section */}
            <Stack direction="row" spacing={0.5}>
              {/* Optional refresh button */}
              {refreshable && (
                <IconButton 
                  size="small" 
                  onClick={onRefresh} 
                  disabled={loading}
                  aria-label="Refresh widget content"
                >
                  <RefreshIcon />
                </IconButton>
              )}
              {/* Action menu dropdown */}
              {actions.length > 0 && (
                <>
                  <IconButton 
                    size="small" 
                    onClick={handleActionMenuOpen}
                    aria-label="Open actions menu"
                  >
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={actionAnchorEl}
                    open={Boolean(actionAnchorEl)}
                    onClose={handleActionMenuClose}
                  >
                    {actions.map((action, index) => (
                      <MenuItem
                        key={index}
                        onClick={() => {
                          action.onClick();
                          handleActionMenuClose();
                        }}
                        disabled={action.disabled || false}
                      >
                        {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
                        <ListItemText>{action.label}</ListItemText>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Widget Content Area - Conditionally rendered based on state */}
        <Collapse in={expanded} timeout={300}>
          <Box sx={{ px: padding, pb: padding, flex: 1 }}>
            {error ? (
              // Error state with retry option
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
                {refreshable && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={onRefresh}
                    sx={{ mt: 2 }}
                  >
                    Retry
                  </Button>
                )}
              </Box>
            ) : (
              // Normal content rendering
              children
            )}
          </Box>
        </Collapse>
      </Card>
    </Grow>
  );
};

// Dashboard Tab Panel
interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      sx={{ mt: 3 }}
    >
      {value === index && <Fade in timeout={300}>{children as ReactElement}</Fade>}
    </Box>
  );
};

// Dashboard Tabs
interface DashboardTab {
  label: string;
  icon?: ReactNode;
  badge?: number;
  content: ReactNode;
  disabled?: boolean;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  defaultTab?: number;
  onChange?: (tabIndex: number) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  tabs,
  defaultTab = 0,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    onChange?.(newValue);
  };

  return (
    <Box>
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
              <Stack direction="row" alignItems="center" spacing={1}>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <Badge
                    badgeContent={tab.badge}
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
            }
            disabled={tab.disabled || false}
          />
        ))}
      </Tabs>

      {tabs.map((tab, index) => (
        <TabPanel key={index} value={activeTab} index={index}>
          {tab.content}
        </TabPanel>
      ))}
    </Box>
  );
};

// Dashboard Grid Layout
interface DashboardGridProps {
  children: ReactNode;
  spacing?: number;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  minHeight?: string;
}

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

// Quick Stats Widget
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    period?: string;
  };
  loading?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  loading,
  onClick,
}) => {
  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              boxShadow: 'none',
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: enhancedNeutral[350] }} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {loading ? '---' : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: enhancedNeutral[350] }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {trend.direction === 'up' && (
                  <TrendingUpIcon color="success" fontSize="small" />
                )}
                {trend.direction === 'down' && (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography
                  variant="caption"
                  color={
                    trend.direction === 'up'
                      ? 'success.main'
                      : trend.direction === 'down'
                      ? 'error.main'
                      : 'text.secondary'
                  }
                  sx={{ fontWeight: 500 }}
                >
                  {trend.value}
                  {trend.period && ` ${trend.period}`}
                </Typography>
              </Stack>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                color: color === 'primary' ? statusColors.badgeActive :
                       color === 'success' ? statusColors.systemOnline :
                       color === 'warning' ? statusColors.badgeWarning :
                       color === 'error' ? statusColors.badgeError :
                       `${color}.main`,
                opacity: 0.8, // Slightly more visible
                ml: 2,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
        {loading && <LinearProgress sx={{ mt: 2, height: 2 }} />}
      </CardContent>
    </Card>
  );
};

// Activity Feed Widget
interface ActivityItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  timestamp: string;
  icon?: ReactNode;
  avatar?: string;
  user?: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
  showTimestamps?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading,
  emptyMessage = 'No recent activity',
  maxItems = 10,
  showTimestamps = true,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (loading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 3 }, (_, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'action.hover',
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ height: 16, bgcolor: 'action.hover', mb: 1 }} />
              <Box sx={{ height: 12, bgcolor: 'action.hover', width: '70%' }} />
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  if (displayedActivities.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" sx={{ color: enhancedNeutral[350] }}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {displayedActivities.map((activity, index) => (
        <Box key={activity.id}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {activity.avatar ? (
              <Avatar
                src={activity.avatar}
                alt={activity.user || ''}
                sx={{ width: 32, height: 32 }}
              >
                {activity.user?.charAt(0).toUpperCase()}
              </Avatar>
            ) : (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: `${activity.type}.light`,
                  color: `${activity.type}.dark`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activity.icon || <NotificationsIcon fontSize="small" />}
              </Box>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {activity.title}
              </Typography>
              {activity.description && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {activity.description}
                </Typography>
              )}
              {showTimestamps && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  {activity.timestamp}
                </Typography>
              )}
            </Box>
          </Stack>
          {index < displayedActivities.length - 1 && (
            <Divider sx={{ mt: 2 }} />
          )}
        </Box>
      ))}
    </Stack>
  );
};

// Dashboard Layout Wrapper
interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string; current?: boolean }>;
  actions?: Array<{
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'text' | 'outlined' | 'contained';
    color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    disabled?: boolean;
    loading?: boolean;
  }>;
  children: ReactNode;
  loading?: boolean;
  status?: {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
  headerContent?: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  loading,
  status,
  headerContent,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader
        title={title}
        {...(subtitle && { subtitle })}
        {...(breadcrumbs && { breadcrumbs })}
        {...(actions && { actions })}
        {...(status && { status })}
        {...(loading !== undefined && { loading })}
      />
      
      {headerContent && (
        <Box sx={{ mb: 3 }}>
          {headerContent}
        </Box>
      )}

      <Box>{children}</Box>
    </Box>
  );
};

// Export all components
export {
  TabPanel,
  type DashboardTab,
  type ActivityItem,
  type StatCardProps,
  type DashboardWidgetProps,
};
