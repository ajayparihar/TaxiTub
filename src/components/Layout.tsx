// TaxiTub Module: Layout Components
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Reusable layout components for consistent page structure

import React, { ReactNode } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Breadcrumbs,
  Link,
  Chip,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fade,
  Grow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface ActionItem {
  label: string;
  icon?: ReactNode;
  onClick: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  // Additional accessibility attributes
  'aria-label'?: string;
  'aria-haspopup'?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-expanded'?: boolean;
  id?: string;
}

interface StatItem {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
  };
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
  backButton?: {
    onClick: () => void;
    label?: string;
  };
  status?: {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  };
  loading?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions = [],
  backButton,
  status,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (loading) {
    return (
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Skeleton variant="text" width="40%" height={40} />
          <Skeleton variant="text" width="60%" height={20} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={100} height={36} />
            <Skeleton variant="rounded" width={120} height={36} />
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 1, fontSize: '0.875rem' }}>
            {breadcrumbs.map((item, index) => (
              <Typography
                key={index}
                color={item.current ? 'text.primary' : 'text.secondary'}
                component={item.href ? Link : 'span'}
                href={item.href}
                sx={{
                  textDecoration: 'none',
                  '&:hover': item.href ? { textDecoration: 'underline' } : {},
                }}
              >
                {item.label}
              </Typography>
            ))}
          </Breadcrumbs>
        )}

        {/* Header Content */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          {/* Title Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {backButton && (
              <IconButton
                onClick={backButton.onClick}
                aria-label={backButton.label || 'Go back'}
                sx={{
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            )}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {title}
                </Typography>
                {status && (
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ fontSize: '0.75rem' }}
                  />
                )}
              </Stack>
              {subtitle && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 0.5, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Actions */}
          {actions.length > 0 && (
            <Stack direction="row" spacing={1} flexShrink={0}>
              {isMobile ? (
                // Mobile: Show only primary action and overflow menu
                <>
                  {actions[0] && (
                    <Button
                      variant={actions[0].variant || 'contained'}
                      color={actions[0].color || 'primary'}
                      onClick={actions[0].onClick}
                      disabled={!!(actions[0].disabled || actions[0].loading)}
                      startIcon={!actions[0].loading ? actions[0].icon : undefined}
                      size="medium"
                      aria-label={actions[0]['aria-label']}
                      aria-haspopup={actions[0]['aria-haspopup']}
                      aria-expanded={actions[0]['aria-expanded']}
                      id={actions[0].id}
                    sx={{
                      minWidth: actions[0].label ? 'auto' : '48px', // Icon-only buttons get fixed width
                      aspectRatio: actions[0].label ? 'auto' : '1', // Square for icon-only buttons
                      justifyContent: 'center',
                      alignItems: 'center',
                      '& .MuiButton-startIcon': {
                        marginLeft: actions[0].label ? '-4px' : '0', // Reset margin for icon-only buttons
                        marginRight: actions[0].label ? '8px' : '0'
                      }
                    }}
                    >
                      {actions[0].loading ? 'Loading...' : actions[0].label}
                    </Button>
                  )}
                  {actions.length > 1 && (
                    <IconButton aria-label="More actions">
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </>
              ) : (
                // Desktop: Show all actions
                actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || 'outlined'}
                    color={action.color || 'primary'}
                    onClick={action.onClick}
                    disabled={!!(action.disabled || action.loading)}
                    startIcon={!action.loading ? action.icon : undefined}
                    size="medium"
                    aria-label={action['aria-label']}
                    aria-haspopup={action['aria-haspopup']}
                    aria-expanded={action['aria-expanded']}
                    id={action.id}
                    sx={{
                      minWidth: action.label ? 'auto' : '48px', // Icon-only buttons get fixed width
                      aspectRatio: action.label ? 'auto' : '1', // Square for icon-only buttons
                      justifyContent: 'center',
                      alignItems: 'center',
                      '& .MuiButton-startIcon': {
                        marginLeft: action.label ? '-4px' : '0', // Reset margin for icon-only buttons
                        marginRight: action.label ? '8px' : '0'
                      }
                    }}
                  >
                    {action.loading ? 'Loading...' : action.label}
                  </Button>
                ))
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    </Fade>
  );
};

// Content Section Component
interface ContentSectionProps {
  title?: string;
  subtitle?: string;
  actions?: ActionItem[];
  children: ReactNode;
  paper?: boolean;
  loading?: boolean;
  error?: string;
  empty?: {
    title: string;
    subtitle: string;
    action?: ActionItem;
  };
  spacing?: number;
}

export const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  subtitle,
  actions,
  children,
  paper = true,
  loading = false,
  error,
  empty,
  spacing = 3,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const content = (
    <Box sx={{ p: paper ? { xs: 2, sm: 3 } : 0 }}>
      {/* Section Header */}
      {(title || actions) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: title ? 3 : 2 }}
        >
          {title && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          )}
          {actions && actions.length > 0 && (
            <Stack direction="row" spacing={1}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outlined'}
                  color={action.color || 'primary'}
                  onClick={action.onClick}
                  disabled={!!(action.disabled || action.loading)}
                  startIcon={!action.loading ? action.icon : undefined}
                  size={isMobile ? 'medium' : 'small'}
                  aria-label={action['aria-label']}
                  aria-haspopup={action['aria-haspopup']}
                  aria-expanded={action['aria-expanded']}
                  id={action.id}
                  sx={{
                    minWidth: action.label ? 'auto' : '48px', // Icon-only buttons get fixed width
                    aspectRatio: action.label ? 'auto' : '1', // Square for icon-only buttons
                    justifyContent: 'center',
                    alignItems: 'center',
                    '& .MuiButton-startIcon': {
                      marginLeft: action.label ? '-4px' : '0', // Reset margin for icon-only buttons
                      marginRight: action.label ? '8px' : '0'
                    }
                  }}
                >
                  {action.loading ? 'Loading...' : action.label}
                </Button>
              ))}
            </Stack>
          )}
        </Stack>
      )}

      {/* Content */}
      {error ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Error Loading Content
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ py: 4 }}>
          <Stack spacing={2}>
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="text" />
            <Skeleton variant="text" width="60%" />
          </Stack>
        </Box>
      ) : empty ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {empty.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {empty.subtitle}
          </Typography>
          {empty.action && (
            <Button
              variant={empty.action.variant || 'contained'}
              color={empty.action.color || 'primary'}
              onClick={empty.action.onClick}
              startIcon={empty.action.icon}
            >
              {empty.action.label}
            </Button>
          )}
        </Box>
      ) : (
        <Box>{children}</Box>
      )}
    </Box>
  );

  return (
    <Grow in timeout={300}>
      {paper ? <Paper sx={{ mb: spacing }}>{content}</Paper> : <Box sx={{ mb: spacing }}>{content}</Box>}
    </Grow>
  );
};

// Stats Grid Component
interface StatsGridProps {
  stats: StatItem[];
  loading?: boolean;
  columns?: { xs?: number; sm?: number; md?: number; lg?: number };
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  loading = false,
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
}) => {
  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Grid item key={index} xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="text" width="50%" height={16} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {stats.map((stat, index) => (
        <Grid item key={index} xs={12/Math.min(stats.length, columns.xs || 1)} sm={12/(columns.sm || 2)} md={12/(columns.md || 3)} lg={12/(columns.lg || 4)}>
          <Grow in timeout={300 + index * 100}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                '&:hover': {
                  boxShadow: 'none',
                },
              }}
            >
              <CardContent sx={{ position: 'relative' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    {stat.subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {stat.subtitle}
                      </Typography>
                    )}
                    {stat.trend && (
                      <Typography
                        variant="caption"
                        color={
                          stat.trend.direction === 'up'
                            ? 'success.main'
                            : stat.trend.direction === 'down'
                            ? 'error.main'
                            : 'text.secondary'
                        }
                        sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
                      >
                        {stat.trend.direction === 'up' && '↗ '}
                        {stat.trend.direction === 'down' && '↘ '}
                        {stat.trend.value}
                      </Typography>
                    )}
                  </Box>
                  {stat.icon && (
                    <Box
                      sx={{
                        color: stat.color ? `${stat.color}.main` : 'text.secondary',
                        opacity: 0.7,
                      }}
                    >
                      {stat.icon}
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        </Grid>
      ))}
    </Grid>
  );
};

// Action Bar Component
interface ActionBarProps {
  actions: ActionItem[];
  align?: 'left' | 'center' | 'right';
  spacing?: number;
  variant?: 'default' | 'contained';
}

export const ActionBar: React.FC<ActionBarProps> = ({
  actions,
  align = 'right',
  spacing = 2,
  variant = 'default',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const content = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={spacing}
      justifyContent={
        align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end'
      }
    >
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outlined'}
          color={action.color || 'primary'}
          onClick={action.onClick}
          disabled={!!(action.disabled || action.loading)}
          startIcon={!action.loading ? action.icon : undefined}
          size={isMobile ? 'large' : 'medium'}
          sx={{ minWidth: isMobile ? '100%' : 'auto' }}
        >
          {action.loading ? 'Loading...' : action.label}
        </Button>
      ))}
    </Stack>
  );

  return variant === 'contained' ? (
    <Paper sx={{ p: 2, mt: 3 }}>{content}</Paper>
  ) : (
    <Box sx={{ mt: 3 }}>{content}</Box>
  );
};
