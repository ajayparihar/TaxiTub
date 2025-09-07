// TaxiTub Module: Virtualized Table Component
// Version: v1.0.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: Virtual scrolling table with dynamic loading and full dataset search/filtering

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Button,
  Switch,
  FormControlLabel,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  DirectionsCar as DirectionsCarIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
// Virtual scrolling implementation without external dependencies
import { CarInfo } from '../types';

interface VirtualizedTableProps {
  data: CarInfo[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (car: CarInfo) => void;
  onDelete: (carId: string) => void;
  onToggleStatus: (car: CarInfo) => void;
  editingCarId?: string;
  supportsCarStatus?: boolean;
}

interface FilterState {
  search: string;
  model: string;
  seater: string;
  status: string;
  showSuspendedOnly: boolean;
}

const ITEMS_PER_PAGE = 50; // Number of items to show at once

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    model: '',
    seater: '',
    status: '',
    showSuspendedOnly: false,
  });

  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Memoized filtered data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      result = result.filter((car) =>
        car.plateNo.toLowerCase().includes(searchTerm) ||
        car.driverName?.toLowerCase().includes(searchTerm) ||
        car.driverPhone?.toLowerCase().includes(searchTerm) ||
        car.carModel.toLowerCase().includes(searchTerm)
      );
    }

    // Model filter
    if (filters.model) {
      result = result.filter((car) => car.carModel === filters.model);
    }

    // Seater filter
    if (filters.seater) {
      result = result.filter((car) => car.seater.toString() === filters.seater);
    }

    // Status filter
    if (filters.status) {
      if (filters.status === 'active') {
        result = result.filter((car) => car.isActive !== false);
      } else if (filters.status === 'suspended') {
        result = result.filter((car) => car.isActive === false);
      }
    }

    return result;
  }, [data, filters]);

  // Visible data for virtual scrolling
  const visibleData = useMemo(() => {
    return filteredData.slice(0, visibleItems);
  }, [filteredData, visibleItems]);

  // Load more items
  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleItems >= filteredData.length) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + ITEMS_PER_PAGE, filteredData.length));
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, visibleItems, filteredData.length]);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [filters]);

  // Unique values for filters
  const uniqueModels = useMemo(() => {
    return [...new Set(data.map(car => car.carModel))].sort();
  }, [data]);

  const uniqueSeaters = useMemo(() => {
    return [...new Set(data.map(car => car.seater))].sort((a, b) => a - b);
  }, [data]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.model) count++;
    if (filters.seater) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      model: '',
      seater: '',
      status: '',
      showSuspendedOnly: false,
    });
  }, []);

  // Update filter
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle search with debouncing
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter('search', searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, updateFilter]);


  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} />
          ))}
        </Stack>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 2,
          backgroundColor: 'background.paper',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'divider'
        }}
      >
        <Stack spacing={3}>
          {/* Search Row */}
          <TextField
            fullWidth
            placeholder="Search cars by plate number, driver, phone, or model..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'primary.main', fontSize: '1.5rem' }} />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchInput('')}
                    size="small"
                    aria-label="Clear search"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Filters Row */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Filter by Model</InputLabel>
              <Select
                value={filters.model}
                onChange={(e) => updateFilter('model', e.target.value)}
                label="Filter by Model"
              >
                <MenuItem value="">All Models</MenuItem>
                {uniqueModels.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Filter by Seats</InputLabel>
              <Select
                value={filters.seater}
                onChange={(e) => updateFilter('seater', e.target.value)}
                label="Filter by Seats"
              >
                <MenuItem value="">All Seats</MenuItem>
                {uniqueSeaters.map((seater) => (
                  <MenuItem key={seater} value={seater.toString()}>
                    {seater} Seats
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: { xs: '100%', sm: 180 } }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => {
                  const value = e.target.value as string;
                  updateFilter('status', value);
                  updateFilter('showSuspendedOnly', value === 'suspended');
                }}
                label="Filter by Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.showSuspendedOnly}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateFilter('showSuspendedOnly', checked);
                    if (checked) {
                      updateFilter('status', 'suspended');
                    } else if (filters.status === 'suspended') {
                      updateFilter('status', '');
                    }
                  }}
                  color="warning"
                />
              }
              label="Show suspended only"
              sx={{ ml: { xs: 0, sm: 1 } }}
            />

            {activeFiltersCount > 0 && (
              <Button
                onClick={clearAllFilters}
                startIcon={<ClearIcon />}
                variant="contained"
                color="error"
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                Clear Filters
              </Button>
            )}
          </Stack>

          {/* Active Filters */}
          {(filters.search || activeFiltersCount > 0) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
              <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                Active:
              </Typography>
              {filters.search && (
                <Chip
                  label={`"${filters.search}"`}
                  size="small"
                  onDelete={() => {
                    setSearchInput('');
                    updateFilter('search', '');
                  }}
                  sx={{
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText'
                  }}
                />
              )}
              {filters.model && (
                <Chip
                  label={filters.model}
                  size="small"
                  onDelete={() => updateFilter('model', '')}
                  sx={{
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText'
                  }}
                />
              )}
              {filters.seater && (
                <Chip
                  label={`${filters.seater} Seats`}
                  size="small"
                  onDelete={() => updateFilter('seater', '')}
                  sx={{
                    backgroundColor: 'success.light',
                    color: 'success.contrastText'
                  }}
                />
              )}
              {filters.status && (
                <Chip
                  label={filters.status === 'active' ? 'Active' : 'Suspended'}
                  size="small"
                  onDelete={() => updateFilter('status', '')}
                  sx={{
                    backgroundColor: filters.status === 'active' ? 'success.light' : 'error.light',
                    color: filters.status === 'active' ? 'success.contrastText' : 'error.contrastText'
                  }}
                />
              )}
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Results Section */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        {/* Results Header */}
        <Box sx={{ px: 3, py: 2, backgroundColor: 'background.paper' }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {visibleItems < filteredData.length 
                ? `Showing ${visibleItems} of ${filteredData.length} Cars`
                : `${filteredData.length} Cars`
              }
              {(filters.search || activeFiltersCount > 0) && (
                <Typography component="span" variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                  {filters.search ? `matching "${filters.search}"` : '(filtered)'}
                </Typography>
              )}
            </Typography>
            <Button
              variant="outlined"
              onClick={onRefresh}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <DirectionsCarIcon />}
              size="small"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Box>

        {/* Scrollable Table */}
        <Box 
          sx={{ 
            maxHeight: '70vh', 
            overflowY: 'auto',
            overflowX: 'auto',
          }}
        >
          {filteredData.length === 0 ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 8,
              opacity: 0.6
            }}>
              <DirectionsCarIcon sx={{ fontSize: '3rem', color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">
                No cars found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {activeFiltersCount > 0
                  ? "No cars match your current filters"
                  : "No cars available"
                }
              </Typography>
              {activeFiltersCount > 0 && (
                <Button
                  variant="text"
                  onClick={clearAllFilters}
                  startIcon={<ClearIcon />}
                  sx={{ mt: 1 }}
                >
                  Clear Filters
                </Button>
              )}
            </Box>
          ) : (
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'background.paper' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Plate</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Driver</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Model</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Seats</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: 'text.primary' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleData.map((car) => (
                  <TableRow 
                    key={`car-${car.carId}`}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <TableCell 
                      sx={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 600,
                        color: 'primary.main'
                      }}
                    >
                      {car.plateNo}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {car.driverName || '-'}
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                        fontSize: '0.875rem'
                      }}
                    >
                      {car.driverPhone || '-'}
                    </TableCell>
                    <TableCell>
                      {car.carModel}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={car.seater}
                        size="small" 
                        color={
                          car.seater === 4 ? 'primary' :
                          car.seater === 6 ? 'secondary' : 'success'
                        }
                        variant="outlined"
                        sx={{ minWidth: '40px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={car.isActive === false ? 'Suspended' : 'Active'}
                        color={car.isActive === false ? 'error' : 'success'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color={car.isActive === false ? 'success' : 'warning'}
                          onClick={() => onToggleStatus(car)}
                          aria-label={car.isActive === false ? `Activate ${car.plateNo}` : `Suspend ${car.plateNo}`}
                        >
                          {car.isActive === false ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onEdit(car)}
                          aria-label={`Edit ${car.plateNo}`}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDelete(car.carId)}
                          aria-label={`Delete ${car.plateNo}`}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Load More Button */}
          {visibleItems < filteredData.length && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Button
                onClick={loadMore}
                disabled={isLoadingMore}
                startIcon={isLoadingMore ? <CircularProgress size={16} /> : null}
                variant="outlined"
                size="large"
              >
                {isLoadingMore ? 'Loading...' : `Load More (${filteredData.length - visibleItems} remaining)`}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default VirtualizedTable;
