// TaxiTub Module: Loading Components
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Loading states with skeleton loaders

import React from "react";
import {
  Box,
  Skeleton,
  Stack,
  CircularProgress,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  useTheme,
} from "@mui/material";

/**
 * Generic loading spinner with message
 */
export const LoadingSpinner: React.FC<{ 
  message?: string; 
  size?: number;
  fullHeight?: boolean;
}> = ({ 
  message = "Loading...", 
  size = 40,
  fullHeight = false 
}) => {
  const theme = useTheme();
  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        gap: 2,
        py: 4,
        minHeight: fullHeight ? "50vh" : "auto",
        color: theme.palette.primary.main,
      }}
    >
      <CircularProgress 
        size={size} 
        sx={{ color: theme.palette.primary.main }} 
        thickness={4}
      />
      <Typography 
        variant="body2" 
        sx={{ color: theme.palette.text.secondary }}
      >
        {message}
      </Typography>
    </Box>
  );
};

/**
 * Skeleton loader for cards
 */
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <Stack spacing={2}>
    {Array.from({ length: count }, (_, index) => (
      <Paper key={index} sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={32} />
          <Skeleton variant="rounded" width={100} height={32} />
        </Box>
      </Paper>
    ))}
  </Stack>
);

/**
 * Skeleton loader for tables
 */
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  headers?: string[];
}> = ({ 
  rows = 5, 
  columns = 4,
  headers = []
}) => (
  <Paper sx={{ p: 2 }}>
    {headers.length > 0 && (
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
    )}
    <Table>
      <TableHead>
        <TableRow>
          {Array.from({ length: columns }, (_, index) => (
            <TableCell key={index}>
              <Skeleton variant="text" width="80%" height={24} />
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton 
                  variant="text" 
                  width={colIndex === 0 ? "60%" : "100%"} 
                  height={20} 
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

/**
 * Skeleton loader for forms
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <Paper sx={{ p: 3 }}>
    <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
    <Stack spacing={3}>
      {Array.from({ length: fields }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="text" width="20%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rounded" width="100%" height={56} />
        </Box>
      ))}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
        <Skeleton variant="rounded" width={100} height={42} />
        <Skeleton variant="rounded" width={120} height={42} />
      </Box>
    </Stack>
  </Paper>
);

/**
 * Skeleton loader for queue cards
 */
export const QueueSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Stack spacing={2}>
    {Array.from({ length: count }, (_, index) => (
      <Paper key={index} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Skeleton variant="text" width="30%" height={28} />
          <Skeleton variant="rounded" width={80} height={24} />
        </Box>
        <Stack spacing={1}>
          {Array.from({ length: 3 }, (_, rowIndex) => (
            <Box key={rowIndex} sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Skeleton variant="text" width="10%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="25%" height={20} />
              <Skeleton variant="text" width="20%" height={20} />
              <Skeleton variant="text" width="20%" height={20} />
            </Box>
          ))}
        </Stack>
      </Paper>
    ))}
  </Stack>
);

/**
 * Skeleton loader for stats cards
 */
export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
    {Array.from({ length: count }, (_, index) => (
      <Paper key={index} sx={{ p: 2, flex: 1, minWidth: 150 }}>
        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="40%" height={32} />
      </Paper>
    ))}
  </Box>
);

// Premium Loading Screens (latest)
import PremiumLoadingScreen, { 
  PageLoadingScreen as PremiumPageLoadingScreen, 
  OverlayLoadingScreen as PremiumOverlayLoadingScreen, 
  ComponentLoadingScreen as PremiumComponentLoadingScreen 
} from './PremiumLoadingScreen';

// Enhanced Loading Screen (legacy)
import EnhancedLoadingScreen, { 
  PageLoadingScreen, 
  OverlayLoadingScreen, 
  ComponentLoadingScreen 
} from './EnhancedLoadingScreen';

/**
 * Context-aware loading component that shows appropriate skeleton based on type
 */
export const ContextualLoading: React.FC<{
  type: "table" | "form" | "cards" | "queue" | "stats" | "spinner";
  message?: string;
  count?: number;
  columns?: number;
}> = ({ type, message, count, columns }) => {
  switch (type) {
    case "table":
      return <TableSkeleton {...(count && { rows: count })} {...(columns && { columns })} />;
    case "form":
      return <FormSkeleton {...(count && { fields: count })} />;
    case "cards":
      return <CardSkeleton {...(count && { count })} />;
    case "queue":
      return <QueueSkeleton {...(count && { count })} />;
    case "stats":
      return <StatsSkeleton {...(count && { count })} />;
    case "spinner":
    default:
      return <LoadingSpinner {...(message && { message })} fullHeight />;
  }
};

// Export premium loading components (recommended)
export { 
  PremiumLoadingScreen,
  PremiumPageLoadingScreen,
  PremiumOverlayLoadingScreen,
  PremiumComponentLoadingScreen
};

// Export enhanced loading components (legacy)
export { 
  EnhancedLoadingScreen,
  PageLoadingScreen,
  OverlayLoadingScreen,
  ComponentLoadingScreen
};
