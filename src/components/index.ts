// TaxiTub Module: Enhanced MUI Component Library Index
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Central export point for all enhanced MUI components

// Core Providers
export { NotificationProvider, useNotification, useSuccessNotification, useErrorNotification, useWarningNotification, useInfoNotification } from './NotificationProvider';
export { DialogProvider, useDialog, useConfirmDialog, useInfoDialog, useWarningDialog, useErrorDialog } from './DialogProvider';
export { ThemeModeProvider, useThemeMode } from './ThemeModeProvider';

// Layout Components
export { 
  PageHeader, 
  StatsGrid, 
  ContentSection, 
  ActionBar
} from './Layout';

// Dashboard Components
export {
  DashboardWidget,
  DashboardTabs,
  DashboardGrid,
  StatCard,
  ActivityFeed,
  DashboardLayout,
  TabPanel,
  type DashboardTab,
  type ActivityItem,
  type StatCardProps,
  type DashboardWidgetProps,
} from './Dashboard';

// Enhanced Data Display
export { 
  EnhancedTable
} from './EnhancedDataDisplay';

// Enhanced Forms
export { 
  EnhancedForm,
  type FieldConfig
} from './EnhancedForm';

// Responsive Components (existing)
export {
  ResponsiveForm,
  ResponsiveTextField,
  ResponsiveSelectField,
  ResponsiveFormSection,
  FormRow,
  type ResponsiveFormProps,
  type FormFieldProps,
  type SelectFieldProps
} from './ResponsiveForm';

export {
  ResponsiveTable
} from './ResponsiveTable';

// Loading Components
export {
  LoadingSpinner,
  CardSkeleton,
  TableSkeleton,
  FormSkeleton,
  QueueSkeleton,
  StatsSkeleton,
  ContextualLoading,
  // Enhanced loading components with anti-flicker design
  EnhancedLoadingScreen,
  PageLoadingScreen,
  OverlayLoadingScreen,
  ComponentLoadingScreen
} from './Loading';

// Enhanced Loading Components with Better UX
// Note: This component is defined in Loading.tsx and re-exported here
// We can't define JSX components in .ts files

// Accessibility Components (existing)
export { SkipLink, LiveRegion } from './Accessibility';

// Error Boundary Components (existing)
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as ProtectedRoute } from './ProtectedRoute';
export { 
  FeatureErrorBoundary,
  AdminErrorBoundary,
  QueueErrorBoundary,
  BookingErrorBoundary,
  CarManagementErrorBoundary,
  NavigationErrorBoundary 
} from './FeatureErrorBoundary';

// Toast System (existing)
export { ToastProvider } from './Toast';

// Navigation (existing)
export { default as Navigation } from './Navigation';

// Database Cleanup (existing)
export { default as DatabaseCleanup } from './DatabaseCleanup';


// Re-export MUI components with enhanced styling

// Utility functions for component consistency
export const getResponsiveSpacing = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => {
  const spacingMap = {
    xs: { xs: 1, sm: 2 },
    sm: { xs: 2, sm: 3 },
    md: { xs: 3, sm: 4 },
    lg: { xs: 4, sm: 5 },
    xl: { xs: 5, sm: 6 },
  };
  return spacingMap[size];
};

export const getResponsiveColumns = (type: 'stats' | 'cards' | 'table') => {
  const columnMap = {
    stats: { xs: 1, sm: 2, md: 3, lg: 4 },
    cards: { xs: 1, sm: 2, md: 2, lg: 3 },
    table: { xs: 1 }, // Tables are always full width
  };
  return columnMap[type];
};

// Common component props interfaces
export interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

export interface ResponsiveProps {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  retry?: () => void;
}

// Enhanced theme utilities
export { designTokens, primary, accent, neutral, success, error, warning, alpha } from '../theme';

// Commonly used MUI components with enhanced styling applied
export {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Stack,
  Grid,
  Paper,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
  Skeleton,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Radio,
  Switch,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Tabs,
  Tab,
  Badge,
  Menu,
  Tooltip,
  Fade,
  Grow,
  Slide,
  Collapse,
} from '@mui/material';

// Enhanced icons (commonly used)
export {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  LocalTaxi as TaxiIcon,
  Notifications as NotificationsIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
