// TaxiTub Module: QueuePal Dashboard
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: QueuePal interface for adding cars to queue and viewing queue status

import React, { useState, useEffect } from "react";
import { QueueService, CarService } from "../services/api";
import { QueueView, CarInfo } from "../types";
import { useToast } from "../components/Toast";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Grid,
  TextField,
  Chip,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { alpha } from "@mui/material/styles";
import { useConfirmDialog } from "../components";

/**
 * QueuePal Dashboard Component
 * 
 * Primary interface for QueuePal users to manage taxi queues:
 * - View real-time queue status across all seater types
 * - Add available cars to appropriate queues
 * - Search and filter available vehicles with instant client-side filtering
 * - Comprehensive search across all vehicle data
 * 
 * Features:
 * - Loads all car data once for instant search and filtering
 * - Client-side filtering across plate numbers, driver names, phone numbers, and car models
 * - Automatic exclusion of cars already in queue and suspended vehicles
 * - Real-time queue updates after car additions
 * - Responsive design for mobile and desktop use
 */
const QueuePalDashboard: React.FC = () => {
  // Core state management
  const [queues, setQueues] = useState<QueueView[]>([]);              // Current queue status for all seater types
  const [cars, setCars] = useState<CarInfo[]>([]);                    // Available cars for queue assignment
  const [loading, setLoading] = useState(false);                      // Main loading state for UI feedback
  const [selectedCar, setSelectedCar] = useState<CarInfo | null>(null); // Currently selected car for queue addition
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");                   // User input for car search
  const [totalCars, setTotalCars] = useState(0);                      // Total count of cars in system
  const { showSuccess, showError, showWarning } = useToast();         // Toast notification hooks

  // Initialize data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Loads initial data for the dashboard
   * Fetches both queue status and all cars for comprehensive search
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load all cars for comprehensive search and filtering
      const [queuesResult, carsResult] = await Promise.all([
        QueueService.getAllQueues(),                    // Get current queue status
        CarService.getAllCarsForDisplay(),              // Get all cars for search
      ]);

      // Update state based on successful responses
      if (queuesResult.success) setQueues(queuesResult.data || []);
      if (carsResult.success && carsResult.data) {
        setCars(carsResult.data);
        setTotalCars(carsResult.data.length);
      }
    } catch (error) {
      console.error("Failed to load QueuePal data:", error);
      showError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  /**
   * Since all cars are loaded at once, search is now handled client-side
   * by the Autocomplete component's built-in filtering
   */


  const confirmDialog = useConfirmDialog();

  const handleAddCarToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCar) {
      showWarning("Please select a car first");
      return;
    }

    setLoading(true);
    try {
      const result = await QueueService.addCarToQueue({ carId: selectedCar.carId });
      if (result.success) {
        setSelectedCar(null);
        setSearchTerm("");
        loadInitialData(); // Refresh both queues and cars
        showSuccess(`Car ${selectedCar.plateNo} added to queue.`);
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (error) {
      showError("Failed to add car to queue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get cars that are not currently in any queue
  const handleClearQueue = async (seater: number) => {
    const confirmed = await confirmDialog(
      "Clear Queue",
      `Are you sure you want to clear all cars from the ${seater}-seater queue? This action cannot be undone.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await QueueService.clearQueueBySeater(seater);
      if (result.success) {
        const cleared = result.data?.cleared ?? 0;
        if (cleared > 0) {
          showSuccess(`${cleared} car${cleared !== 1 ? 's' : ''} removed from ${seater}-seater queue.`);
        } else {
          showWarning(`No cars to remove from ${seater}-seater queue.`);
        }
        loadInitialData();
      } else {
        showError(result.message || "Failed to clear queue");
      }
    } catch (error) {
      showError("Failed to clear queue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAvailableCars = () => {
    const carsInQueue = new Set<string>();
    queues.forEach((queue) => {
      queue.cars.forEach((car) => carsInQueue.add(car.carId));
    });

    // Filter out cars that are already in queue or are suspended
    return cars.filter((car) => 
      !carsInQueue.has(car.carId) && car.isActive !== false
    );
  };


  const availableCars = getAvailableCars();

  return (
    <Box>
      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", sm: "center" }} 
        spacing={2} 
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
          QueuePal Terminal
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshRoundedIcon />} 
          onClick={loadInitialData}
          disabled={loading}
          size="small"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>

      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
          Add Car to Queue
        </Typography>
        <Box component="form" onSubmit={handleAddCarToQueue} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Autocomplete
                options={availableCars}
                getOptionLabel={(option) => `${option.plateNo} - ${option.driverName}`}
                value={selectedCar}
                onChange={(_, newValue) => setSelectedCar(newValue)}
                inputValue={searchTerm}
                onInputChange={(_, newInputValue) => setSearchTerm(newInputValue)}
                renderInput={(params) => {
                  return (
                    <TextField
                      {...params}
                      label="Search Vehicle or Driver"
                      placeholder="e.g., DL01CA1234, driver name, or car model"
                      fullWidth
                      size="medium"
                      InputLabelProps={Object.fromEntries(
                        Object.entries(params.InputLabelProps || {}).filter(([_, value]) => value !== undefined)
                      )}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loading && <CircularProgress size={20} />}
                            {params.InputProps?.endAdornment}
                          </>
                        ),
                      }}
                    />
                  );
                }}
                renderOption={(props, option) => {
                  return (
                    <Box 
                      component="li" 
                      {...props} 
                      key={option.carId} 
                      sx={{ py: 1 }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {option.plateNo} - {option.driverName}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {option.carModel} ({option.seater}-seater)
                          {option.isActive === false && (
                            <Chip 
                              label="Suspended" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                              sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
                ListboxProps={{
                  style: { maxHeight: '300px' },
                }}
                // Enable built-in filtering for client-side search
                filterOptions={(options, { inputValue }) => {
                  if (!inputValue) return options;
                  
                  const searchTerm = inputValue.toLowerCase();
                  return options.filter((option) =>
                    option.plateNo.toLowerCase().includes(searchTerm) ||
                    option.driverName?.toLowerCase().includes(searchTerm) ||
                    option.carModel.toLowerCase().includes(searchTerm) ||
                    option.driverPhone?.toLowerCase().includes(searchTerm)
                  );
                }}
                noOptionsText={
                  loading ? "Loading vehicles..." : 
                  searchTerm ? "No vehicles match your search" : "Type to search available vehicles"
                }
                clearOnBlur={false}
                selectOnFocus
                handleHomeEndKeys
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button 
                variant="contained" 
                type="submit" 
                disabled={loading || !selectedCar} 
                fullWidth
                size="large"
                sx={{ height: "56px" }}
              >
                {loading ? "Adding..." : "Add to Queue"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        {availableCars.length === 0 && !loading && !selectedCar && (
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.8, textAlign: "center" }}>
            {searchTerm ? 
              `No available vehicles found matching "${searchTerm}"` :
              `⚠️ All ${totalCars} cars are currently in queue or assigned.`
            }
          </Typography>
        )}
      </Paper>

      <Stack spacing={2}>
        {queues.map((queue) => {
          const nextCar = queue.cars.length > 0 ? queue.cars[0] : null;
          
          return (
            <Paper key={queue.seater} sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack 
                direction="row" 
                justifyContent="space-between" 
                alignItems="center" 
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                  {queue.seater}-Seater Queue
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={`${queue.cars.length} car${queue.cars.length !== 1 ? "s" : ""}`} 
                    color="primary" 
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleClearQueue(queue.seater)}
                    disabled={loading || queue.cars.length === 0}
                    sx={{ textTransform: 'none' }}
                    aria-label={`Clear ${queue.seater}-seater queue`}
                  >
                    Clear queue
                  </Button>
                </Stack>
              </Stack>
              
              {!nextCar ? (
                <Typography variant="body2" sx={{ opacity: 0.8, textAlign: "center", py: 3 }}>
                  Queue is empty
                </Typography>
              ) : (
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08), 
                    border: "1px solid", 
                    borderColor: 'success.main',
                    borderRadius: 1,
                    position: "relative"
                  }}
                >
                  <Chip 
                    size="small" 
                    label="NEXT" 
                    color="success" 
                    sx={{ position: "absolute", top: 8, right: 8 }}
                  />
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                        Plate No
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {nextCar.plateNo}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                        Driver
                      </Typography>
                      <Typography variant="body1">
                        {nextCar.driverName}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                        Model
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {nextCar.carModel}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Added: {new Date(nextCar.timestampAdded).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
};

export default QueuePalDashboard;
