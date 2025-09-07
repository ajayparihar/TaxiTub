// TaxiTub Module: Enhanced Data Display Components
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Advanced table and list components with sorting, filtering, and pagination

import React, { useState, useMemo, ReactNode } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Collapse,
  Button,
  Checkbox,
  Skeleton,
  useMediaQuery,
  useTheme,
  Fade,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

type SortDirection = 'asc' | 'desc';

interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}


interface ColumnConfig<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, item: T) => ReactNode;
  hideOnMobile?: boolean;
  sticky?: boolean;
}

interface ActionConfig<T> {
  label: string;
  icon?: ReactNode;
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  variant?: 'text' | 'outlined' | 'contained';
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  actions?: ActionConfig<T>[];
  loading?: boolean;
  title?: string;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  keyExtractor: (item: T) => string;
  expandable?: {
    render: (item: T) => ReactNode;
    getExpandedState?: (item: T) => boolean;
  };
  onRowClick?: (item: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: T[]) => void;
  toolbar?: ReactNode;
  density?: 'comfortable' | 'standard' | 'compact';
}

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  title,
  searchable = true,
  filterable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  emptyMessage = 'No data available',
  keyExtractor,
  expandable,
  onRowClick,
  selectable = false,
  onSelectionChange,
  toolbar,
  density = 'standard',
}: EnhancedTableProps<T>) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(isMobile ? 'cards' : 'table');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchable && searchTerm) {
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    if (filterable) {
      filtered = filtered.filter((item) => {
        return Object.entries(filters).every(([key, filterValue]) => {
          if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
            return true;
          }
          const itemValue = String(item[key]).toLowerCase();
          if (Array.isArray(filterValue)) {
            return filterValue.some(val => itemValue.includes(val.toLowerCase()));
          }
          return itemValue.includes(String(filterValue).toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortable && sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === bValue) return 0;
        
        const comparison = aValue > bValue ? 1 : -1;
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortConfig, searchable, filterable, sortable]);

  // Pagination
  const paginatedData = paginated
    ? processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : processedData;

  // Event handlers
  const handleSort = (column: keyof T) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key === column) {
        if (current.direction === 'asc') {
          return { key: column, direction: 'desc' };
        }
        return null; // Remove sorting
      }
      return { key: column, direction: 'asc' };
    });
  };

  const handleExpandRow = (key: string) => {
    setExpandedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleSelectRow = (key: string) => {
    if (!selectable) return;

    setSelectedRows(current => {
      const newSet = new Set(current);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      
      if (onSelectionChange) {
        const selectedItems = data.filter(dataItem => 
          newSet.has(keyExtractor(dataItem))
        );
        onSelectionChange(selectedItems);
      }
      
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (!selectable) return;

    const allSelected = selectedRows.size === processedData.length;
    if (allSelected) {
      setSelectedRows(new Set());
      if (onSelectionChange) onSelectionChange([]);
    } else {
      const newSet = new Set(processedData.map(keyExtractor));
      setSelectedRows(newSet);
      if (onSelectionChange) onSelectionChange(processedData);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    setPage(0);
  };

  // Loading state
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        {title && (
          <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        )}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={56} />
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((_, index) => (
                <TableCell key={index}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton variant="text" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  // Mobile card view
  if (viewMode === 'cards') {
    return (
      <Fade in timeout={300}>
        <Box>
          {/* Header */}
          {title && (
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              {title}
            </Typography>
          )}

          {/* Search and filters */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            {searchable && (
              <TextField
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} aria-label="Clear search">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                fullWidth
              />
            )}

            {toolbar && (
              <Box>{toolbar}</Box>
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              {filterable && (
                <Button
                  startIcon={<FilterIcon />}
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  variant="outlined"
                  size="small"
                >
                  Filters {Object.keys(filters).length > 0 && `(${Object.keys(filters).length})`}
                </Button>
              )}
              
              <Button
                startIcon={<ViewListIcon />}
                onClick={() => setViewMode('table')}
                variant="outlined"
                size="small"
              >
                Table View
              </Button>
              
              {Object.keys(filters).length > 0 && (
                <Button onClick={clearFilters} size="small">
                  Clear All
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Cards */}
          <Stack spacing={2}>
            {paginatedData.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </Box>
            ) : (
              paginatedData.map((item) => {
                const key = keyExtractor(item);
                const isExpanded = expandedRows.has(key);
                const isSelected = selectedRows.has(key);

                return (
                  <Card
                    key={key}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderWidth: isSelected ? 2 : 1,
                    }}
                    onClick={() => onRowClick?.(item)}
                  >
                    <CardContent>
                      {/* Card content */}
                      {columns.filter(col => !col.hideOnMobile).map((column) => (
                        <Box
                          key={String(column.key)}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {column.label}:
                          </Typography>
                          <Box sx={{ textAlign: 'right' }}>
                            {column.format
                              ? column.format(item[column.key], item)
                              : String(item[column.key])}
                          </Box>
                        </Box>
                      ))}

                      {/* Actions */}
                      {actions.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          {actions.map((action, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={action.variant || 'outlined'}
                              color={action.color || 'primary'}
                              size="small"
                              startIcon={action.icon}
                              onClick={() => action.onClick(item)}
                              disabled={action.disabled?.(item) || false}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Stack>
                      )}

                      {/* Expandable content */}
                      {expandable && (
                        <>
                          <Button
                            onClick={() => handleExpandRow(key)}
                            startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ mt: 1 }}
                          >
                            {isExpanded ? 'Show Less' : 'Show More'}
                          </Button>
                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2 }}>
                              {expandable.render(item)}
                            </Box>
                          </Collapse>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </Stack>

          {/* Pagination */}
          {paginated && processedData.length > rowsPerPage && (
            <TablePagination
              component="div"
              count={processedData.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      </Fade>
    );
  }

  // Desktop table view
  const visibleColumns = columns.filter(col => !col.hideOnMobile || !isMobile);

  return (
    <Fade in timeout={300}>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Header */}
        {title && (
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>
        )}

        {/* Toolbar */}
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Search and view toggle */}
            <Stack direction="row" spacing={2} alignItems="center">
              {searchable && (
                <TextField
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm && (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setSearchTerm('')} aria-label="Clear search">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 300 }}
                />
              )}

              <Box sx={{ flexGrow: 1 }} />

              {/* Controls */}
              <Stack direction="row" spacing={1}>
                
                <IconButton
                  onClick={() => setViewMode('cards')}
                  color={(viewMode as string) === 'cards' ? 'primary' : 'default'}
                  aria-label="Cards view"
                >
                  <ViewModuleIcon />
                </IconButton>
              </Stack>
            </Stack>

            {toolbar && (
              <Box>{toolbar}</Box>
            )}

            {/* Active filters */}
            {Object.keys(filters).length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Active filters:
                </Typography>
                {Object.entries(filters).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                    onDelete={() => {
                      setFilters(current => {
                        const newFilters = { ...current };
                        delete newFilters[key];
                        return newFilters;
                      });
                    }}
                    size="small"
                  />
                ))}
                <Button onClick={clearFilters} size="small">
                  Clear All
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table
            size={density === 'compact' ? 'small' : density === 'comfortable' ? 'medium' : 'small'}
            stickyHeader
          >
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedRows.size === processedData.length}
                      indeterminate={selectedRows.size > 0 && selectedRows.size < processedData.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                
                {expandable && <TableCell width={50} />}
                
                {visibleColumns.map((column) => (
                  <TableCell
                    key={String(column.key)}
                    align={column.align || 'left'}
                    sx={{
                      width: column.width,
                      position: column.sticky ? 'sticky' : 'static',
                      left: column.sticky ? 0 : 'auto',
                      backgroundColor: column.sticky ? 'background.paper' : 'transparent',
                      zIndex: column.sticky ? 1 : 'auto',
                    }}
                  >
                    {sortable && column.sortable !== false ? (
                      <TableSortLabel
                        active={sortConfig?.key === column.key}
                        direction={sortConfig?.key === column.key ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                
                {actions.length > 0 && (
                  <TableCell align="right">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      visibleColumns.length +
                      (selectable ? 1 : 0) +
                      (expandable ? 1 : 0) +
                      (actions.length > 0 ? 1 : 0)
                    }
                    sx={{ textAlign: 'center', py: 6 }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => {
                  const key = keyExtractor(item);
                  const isExpanded = expandedRows.has(key);
                  const isSelected = selectedRows.has(key);

                  return (
                    <React.Fragment key={key}>
                      <TableRow
                        hover
                        selected={isSelected}
                        sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        onClick={() => onRowClick?.(item)}
                      >
                        {selectable && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelectRow(key)}
                            />
                          </TableCell>
                        )}
                        
                        {expandable && (
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(key)}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                        )}
                        
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={String(column.key)}
                            align={column.align || 'left'}
                          >
                            {column.format
                              ? column.format(item[column.key], item)
                              : String(item[column.key])}
                          </TableCell>
                        ))}
                        
                        {actions.length > 0 && (
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5}>
                              {actions.map((action, actionIndex) => (
                                <IconButton
                                  key={actionIndex}
                                  size="small"
                                  color={action.color || 'primary'}
                                  onClick={() => action.onClick(item)}
                                  disabled={action.disabled?.(item) || false}
                                  title={action.label}
                                  aria-label={action.label}
                                >
                                  {action.icon}
                                </IconButton>
                              ))}
                            </Stack>
                          </TableCell>
                        )}
                      </TableRow>
                      
                      {expandable && (
                        <TableRow>
                          <TableCell
                            colSpan={
                              visibleColumns.length +
                              (selectable ? 1 : 0) +
                              (expandable ? 1 : 0) +
                              (actions.length > 0 ? 1 : 0)
                            }
                            sx={{ py: 0, border: 0 }}
                          >
                            <Collapse in={isExpanded}>
                              <Box sx={{ p: 2 }}>
                                {expandable.render(item)}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {paginated && processedData.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={processedData.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        )}
      </Paper>
    </Fade>
  );
}
