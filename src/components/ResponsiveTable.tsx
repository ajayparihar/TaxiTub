// TaxiTub Module: Responsive Table Component
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Mobile-responsive table with card view fallback

import React from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { BaseComponentProps, TableAction } from "../types";
import { alpha } from "../theme";

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string | number;
  align?: "left" | "center" | "right";
  format?: (value: any, item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  mobileLabel?: string; // Label to show in mobile card view
}

export interface ResponsiveTableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  emptyMessage?: string;
  title?: string;
  keyExtractor: (item: T) => string;
  mobileBreakpoint?: "xs" | "sm" | "md";
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyMessage = "No data available",
  title,
  keyExtractor,
  mobileBreakpoint = "md",
  className,
  "data-testid": testId,
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));

  const visibleColumns = isMobile 
    ? columns.filter(col => !col.hideOnMobile)
    : columns;

  const formatCellValue = (column: TableColumn<T>, item: T) => {
    const value = item[column.key];
    return column.format ? column.format(value, item) : value;
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2 }} {...(className && { className })} {...(testId && { "data-testid": testId })}>
        {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Loading...
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 2 }} {...(className && { className })} {...(testId && { "data-testid": testId })}>
        {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {emptyMessage}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <Box {...(className && { className })} {...(testId && { "data-testid": testId })}>
        {title && (
          <Typography variant="h6" sx={{ mb: 2, px: 1 }}>
            {title}
          </Typography>
        )}
        <Stack spacing={2}>
          {data.map((item) => (
            <Card key={keyExtractor(item)} variant="outlined">
              <CardContent sx={{ pb: "16px !important" }}>
                {visibleColumns.map((column, colIndex) => {
                  const value = formatCellValue(column, item);
                  const displayLabel = column.mobileLabel || column.label;
                  
                  return (
                    <Box
                      key={String(column.key)}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                        ...(colIndex === 0 && { fontWeight: 600 }),
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          opacity: 0.8, 
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          minWidth: "40%"
                        }}
                      >
                        {displayLabel}:
                      </Typography>
                      <Box 
                        sx={{ 
                          textAlign: "right",
                          maxWidth: "60%",
                          overflow: "hidden",
                        }}
                      >
                        {typeof value === "string" || typeof value === "number" ? (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              ...(colIndex === 0 && { fontWeight: 600 }),
                            }}
                          >
                            {value}
                          </Typography>
                        ) : (
                          value
                        )}
                      </Box>
                    </Box>
                  );
                })}
                {actions.length > 0 && (
                  <Box sx={{ mt: 1, display: "flex", gap: 1, justifyContent: "flex-end" }}>
                    {actions.map((action, actionIndex) => (
                      <IconButton
                        key={actionIndex}
                        size="small"
                        color={action.color || "primary"}
                        onClick={() => action.onClick(item)}
                        disabled={!!(action.disabled?.(item))}
                        aria-label={action.label}
                      >
                        {action.icon}
                      </IconButton>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  }

  // Desktop Table View
  return (
    <Paper sx={{ overflowX: "auto" }} {...(className && { className })} {...(testId && { "data-testid": testId })}>
      {title && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      )}
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={String(column.key)}
                align={column.align || "left"}
                sx={{ 
                  width: column.width,
                  fontWeight: 600,
                }}
              >
                {column.label}
              </TableCell>
            ))}
            {actions.length > 0 && (
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={keyExtractor(item)} hover>
              {columns.map((column) => (
                <TableCell
                  key={String(column.key)}
                  align={column.align || "left"}
                >
                  {formatCellValue(column, item)}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right">
                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                    {actions.map((action, actionIndex) => (
                      <IconButton
                        key={actionIndex}
                        size="small"
                        color={action.color || "primary"}
                        onClick={() => action.onClick(item)}
                        disabled={!!(action.disabled?.(item))}
                        aria-label={action.label}
                        className="focus-ring"
                        sx={{
                          '&:focus': {
                            outline: 'none',
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
                          }
                        }}
                      >
                        {action.icon}
                      </IconButton>
                    ))}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
