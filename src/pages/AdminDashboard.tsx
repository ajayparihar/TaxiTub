// TaxiTub Module: Admin Dashboard
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: Bheb Developer
// Changelog: Admin interface for car/QueuePal management and system monitoring

import React, { useState, useEffect } from "react";
import {
  CarService,
  QueueService,
} from "../services/api";
import { StaffService, QueuePalStaff } from "../services/auth";
import { CarInfo, QueueView } from "../types";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Grid,
  Breadcrumbs,
  Link,
  TextField,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Tooltip,
  Collapse,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DatabaseCleanup from "../components/DatabaseCleanup";
import VirtualizedTable from "../components/VirtualizedTable";
import CarEditDialog from "../components/CarEditDialog";
import { useNotification, useConfirmDialog } from "../components";
import { statusColors, enhancedNeutral, alpha } from "../theme";

const AdminDashboard: React.FC = () => {
  const [cars, setCars] = useState<CarInfo[]>([]);
  const [queues, setQueues] = useState<QueueView[]>([]);
  const [loading, setLoading] = useState(false);
  const [carStats, setCarStats] = useState({ totalCars: 0, carsInQueue: 0 });
  
  const { showSuccess, showError, showWarning } = useNotification();
  const confirmDialog = useConfirmDialog();
  const [activeTab, setActiveTab] = useState("cars");
  const [newCar, setNewCar] = useState({
    plateNo: "",
    driverName: "",
    driverPhone: "",
    carModel: "",
    seater: 4,
  });
  const [supportsCarStatus, setSupportsCarStatus] = useState<boolean | null>(null);
  const [collapsedQueues, setCollapsedQueues] = useState<Record<number, boolean>>({});
  
  // Car editing dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [carToEdit, setCarToEdit] = useState<CarInfo | null>(null);
  
  // Staff Management State
  const [staffMembers, setStaffMembers] = useState<QueuePalStaff[]>([]);
  const [newStaff, setNewStaff] = useState({
    username: "",
    name: "",
    contact: "",
    password: "",
  });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaff, setEditStaff] = useState({
    username: "",
    name: "",
    contact: "",
    password: "",
  });
  // Passwords are not displayed in UI for security
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false);
  
  // Toggle password visibility for a specific staff member
  const togglePasswordVisibility = (staffId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh handler for virtualized table
  const handleRefresh = () => {
    loadData();
  };

  // Toggle queue collapse
  const toggleQueueCollapse = (seater: number) => {
    setCollapsedQueues(prev => {
      const currentState = prev[seater] !== false; // Default to true (collapsed)
      return {
        ...prev,
        [seater]: !currentState
      };
    });
  };

  // Check if queue is collapsed (default to collapsed = true)
  const isQueueCollapsed = (seater: number) => {
    return collapsedQueues[seater] !== false; // Default to collapsed unless explicitly set to false
  };


  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading all cars for virtual scrolling...');
      
      // Load all data in parallel
      const [carsResult, queuesResult, staffResult, statusSupport] =
        await Promise.all([
          CarService.getAllCarsForDisplay(),
          QueueService.getAllQueues(),
          StaffService.getAllStaff(),
          CarService.supportsCarStatus(),
        ]);

      // Set all cars for client-side filtering
      if (carsResult.success && carsResult.data) {
        setCars(carsResult.data);
      }
      
      if (queuesResult.success) setQueues(queuesResult.data || []);
      if (staffResult.success) setStaffMembers(staffResult.data || []);
      setSupportsCarStatus(Boolean(statusSupport));
      
      // Calculate car statistics
      const totalCars = carsResult.success && carsResult.data ? carsResult.data.length : 0;
      const carsInQueue = (queuesResult.data || []).reduce((total, queue) => total + queue.cars.length, 0);
      setCarStats({ totalCars, carsInQueue });
      
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Car editing handlers
  const handleEditCar = (car: CarInfo) => {
    setCarToEdit(car);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setCarToEdit(null);
  };

  const handleSaveCarEdit = async (carId: string, updates: Partial<CarInfo>) => {
    try {
      const result = await CarService.updateCar(carId, updates);
      if (result.success) {
        loadData();
        showSuccess("Car updated successfully.");
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (error) {
      showError("Failed to update car");
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    if (!newCar.plateNo.trim()) {
      showError("Plate number is required.");
      return;
    }
    if (!newCar.carModel.trim()) {
      showError("Car model is required.");
      return;
    }
    if (!newCar.seater || newCar.seater < 4 || newCar.seater > 8) {
      showError("Enter a seater count between 4 and 8.");
      return;
    }

    setLoading(true);

    try {
      const result = await CarService.addCar(newCar);
      if (result.success) {
        setNewCar({
          plateNo: "",
          driverName: "",
          driverPhone: "",
          carModel: "",
          seater: 4,
        });
        // Reload all data
        loadData();
        showSuccess("Car added successfully.");
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (error) {
      showError("Failed to add car");
    } finally {
      setLoading(false);
    }
  };

// Commented out - QueuePal functionality disabled
  // const handleAddQueuePal = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   try {
  //     showError("QueuePal management temporarily disabled");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const startEditQueuePal = (qp: QueuePal) => {
  //   setEditingQueuePalId(qp.queuePalId);
  //   setEditQueuePal({ name: qp.name, contact: qp.contact, assignedBy: qp.assignedBy });
  // };

  // const cancelEditQueuePal = () => {
  //   setEditingQueuePalId(null);
  //   setEditQueuePal({ name: "", contact: "", assignedBy: "Admin" });
  // };

  // const handleUpdateQueuePal = async () => {
  //   if (!editingQueuePalId) return;
  //   setLoading(true);
  //   try {
  //     showError("QueuePal management temporarily disabled");
  //   } catch (error) {
  //     showError("Failed to update QueuePal");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleDeleteQueuePal = async (queuePalId: string) => {
  //   const confirmed = await confirmDialog(
  //     "Delete QueuePal",
  //     "Are you sure you want to delete this QueuePal?"
  //   );
  //   if (confirmed) {
  //     showError("QueuePal management temporarily disabled");
  //   }
  // };

  const handleDeleteCar = async (carId: string) => {
    const confirmed = await confirmDialog(
      "Delete Car",
      "Are you sure you want to delete this car?"
    );
    if (confirmed) {
      const result = await CarService.deleteCar(carId);
      if (result.success) {
        loadData();
        showSuccess("Car deleted.");
      } else {
        showError(`Error: ${result.message}`);
      }
    }
  };

  // Staff Management Handlers
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newStaff.username.trim()) {
      showError("Username is required.");
      return;
    }
    if (!newStaff.password.trim()) {
      showError("Password is required.");
      return;
    }
    if (newStaff.password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await StaffService.addStaff(newStaff);
      if (result.success) {
        setNewStaff({
          username: "",
          name: "",
          contact: "",
          password: "",
        });
        loadData();
        showSuccess("Staff member added.");
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (error) {
      showError("Failed to add staff member");
    } finally {
      setLoading(false);
    }
  };

  const startEditStaff = (staff: QueuePalStaff) => {
    setEditingStaffId(staff.id);
    setEditStaff({
      username: staff.username,
      name: staff.name,
      contact: staff.contact,
      password: staff.password,
    });
  };

  const cancelEditStaff = () => {
    setEditingStaffId(null);
    setEditStaff({
      username: "",
      name: "",
      contact: "",
      password: "",
    });
  };

  const handleUpdateStaff = async () => {
    if (!editingStaffId) return;

    // Validation
    if (!editStaff.username.trim()) {
      showError("Username is required.");
      return;
    }
    if (!editStaff.password.trim()) {
      showError("Password is required.");
      return;
    }
    if (editStaff.password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await StaffService.updateStaff(editingStaffId, editStaff);
      if (result.success) {
        cancelEditStaff();
        loadData();
        showSuccess("Staff member updated.");
      } else {
        showError(`Error: ${result.message}`);
      }
    } catch (error) {
      showError("Failed to update staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStaffStatus = async (staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;

    const action = staff.isActive ? "suspend" : "activate";
    const confirmed = await confirmDialog(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Staff Member`,
      `Are you sure you want to ${action} ${staff.name}?`
    );
    
    if (confirmed) {
      const result = await StaffService.toggleStaffStatus(staffId);
      if (result.success) {
        loadData();
        showSuccess(action === "suspend" ? "Staff member suspended." : "Staff member activated.");
      } else {
        showError(`Error: ${result.message}`);
      }
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    const staff = staffMembers.find(s => s.id === staffId);
    if (!staff) return;

    const confirmed = await confirmDialog(
      "Delete Staff Member",
      `Are you sure you want to permanently delete ${staff.name || staff.username}? This action cannot be undone.`
    );
    
    if (confirmed) {
      const result = await StaffService.deleteStaff(staffId);
      if (result.success) {
        loadData();
        showSuccess("Staff member deleted.");
      } else {
        showError(`Error: ${result.message}`);
      }
    }
  };

  // Toggle car status (active/suspended)
  const handleToggleCarStatus = async (car: CarInfo) => {
    const action = car.isActive === false ? "activate" : "suspend";
    const confirmed = await confirmDialog(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Car`,
      `Are you sure you want to ${action} ${car.plateNo}? ${action === 'suspend' ? 'Suspended cars cannot be added to queues.' : ''}`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await CarService.toggleCarStatus(car.carId);
      if (result.success) {
        showSuccess(action === 'suspend' ? 'Car suspended.' : 'Car activated.');
        loadData();
      } else {
        showError(result.message || 'Failed to update car status');
      }
    } catch (error) {
      showError('Failed to update car status');
    } finally {
      setLoading(false);
    }
  };


  // Clear queue for a given seater (Admin)
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
          // Use warning to indicate nothing to clear
          showWarning(`No cars to remove from ${seater}-seater queue.`);
        }
        loadData();
      } else {
        showError(result.message || "Failed to clear queue");
      }
    } catch (error) {
      showError("Failed to clear queue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Box sx={{ mb: 1 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => setActiveTab('cars')}
            aria-label="Go to Admin overview"
          >
            Admin
          </Link>
          <Typography color="text.primary">
            {activeTab === 'cars' ? 'Cars' : activeTab === 'queues' ? 'Queues' : activeTab === 'queuepals' ? 'Staff' : 'Database'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Stack 
        direction={{ xs: "column", sm: "row" }} 
        justifyContent="space-between" 
        alignItems={{ xs: "flex-start", sm: "center" }} 
        spacing={2} 
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
          Admin Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          onClick={handleRefresh}
          disabled={loading}
          size="small"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>

      {/* Status feature banner if DB column missing */}
      {supportsCarStatus === false && (
        <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'warning.main', backgroundColor: (t) => alpha(t.palette.warning.main, 0.08) }}>
          <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 600 }}>
            Car status (Active/Suspended) is enabled in the app, but your database hasn’t been upgraded yet.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Run the migration at <code>scripts/add_is_active_to_carinfo.sql</code> in your Supabase SQL Editor, then refresh.
          </Typography>
        </Paper>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2 }}
      >
        <Tab 
          value="cars" 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DirectionsCarRoundedIcon fontSize="small" />
              <span>{`Cars (${carStats.totalCars})`}</span>
            </Box>
          } 
          sx={{ minWidth: "auto" }} 
        />
        <Tab value="queues" label={`Queues (${carStats.carsInQueue})`} sx={{ minWidth: "auto" }} />
        <Tab value="queuepals" label={`Staff (${staffMembers.length})`} sx={{ minWidth: "auto" }} />
        <Tab value="database" label="Database" sx={{ minWidth: "auto" }} />
      </Tabs>

      {activeTab === "cars" && (
        <Stack spacing={2}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
              Add New Car
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: enhancedNeutral[350] }}>
              Add car details to your fleet. Example: Plate number DL01AB1234.
            </Typography>
            <Box component="form" onSubmit={handleAddCar} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Plate Number"
                    placeholder="DL01AB1234"
                    value={newCar.plateNo}
                    onChange={(e) => setNewCar({ ...newCar, plateNo: e.target.value })}
                    fullWidth
                    required
                    size="medium"
                    error={!newCar.plateNo.trim() && newCar.plateNo !== ""}
                    helperText={!newCar.plateNo.trim() && newCar.plateNo !== "" ? "Plate number is required" : ""}
                    sx={{
                      '& .MuiInputLabel-root': {
                        '&.Mui-required': {
                          '& .MuiInputLabel-asterisk': {
                            color: 'error.main'
                          }
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Driver Name (Optional)"
                    value={newCar.driverName}
                    onChange={(e) => setNewCar({ ...newCar, driverName: e.target.value })}
                    fullWidth
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Driver Phone (Optional)"
                    placeholder="+91-XXXXX-XXXXX"
                    value={newCar.driverPhone}
                    onChange={(e) => setNewCar({ ...newCar, driverPhone: e.target.value })}
                    fullWidth
                    size="medium"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Car Model"
                    placeholder="Toyota Innova"
                    value={newCar.carModel}
                    onChange={(e) => setNewCar({ ...newCar, carModel: e.target.value })}
                    fullWidth
                    required
                    size="medium"
                    error={!newCar.carModel.trim() && newCar.carModel !== ""}
                    helperText={!newCar.carModel.trim() && newCar.carModel !== "" ? "Car model is required" : ""}
                    sx={{
                      '& .MuiInputLabel-root': {
                        '&.Mui-required': {
                          '& .MuiInputLabel-asterisk': {
                            color: 'error.main'
                          }
                        }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <FormControl fullWidth size="medium" required>
                    <InputLabel sx={{
                      '&.Mui-required': {
                        '& .MuiInputLabel-asterisk': {
                          color: 'error.main'
                        }
                      }
                    }}>Seater Type</InputLabel>
                    <Select
                      value={newCar.seater}
                      onChange={(e) =>
                        setNewCar({ ...newCar, seater: parseInt(e.target.value as string) })
                      }
                      label="Seater Type"
                    >
                      <MenuItem value={4}>4 Seater</MenuItem>
                      <MenuItem value={5}>5 Seater</MenuItem>
                      <MenuItem value={6}>6 Seater</MenuItem>
                      <MenuItem value={7}>7 Seater</MenuItem>
                      <MenuItem value={8}>8 Seater</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={loading || !newCar.plateNo.trim() || !newCar.carModel.trim() || !newCar.seater}
                    size="large"
                    fullWidth
                    sx={{ 
                      height: "56px",
                      backgroundColor: (!newCar.plateNo.trim() || !newCar.carModel.trim() || !newCar.seater) ? 'action.disabledBackground' : 'primary.main'
                    }}
                  >
                    {loading ? "Adding..." : "Add Car"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* VirtualizedTable for Fleet Management */}
          <VirtualizedTable
            data={cars}
            loading={loading}
            onRefresh={handleRefresh}
            onEdit={handleEditCar}
            onDelete={handleDeleteCar}
            onToggleStatus={handleToggleCarStatus}
            supportsCarStatus={supportsCarStatus || false}
          />
        </Stack>
      )}

      {activeTab === "queues" && (
        <Stack spacing={2}>
          {queues.map((queue) => {
            const isCollapsed = isQueueCollapsed(queue.seater);
            return (
              <Paper key={queue.seater} elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Collapsible Header */}
                <Box 
                  sx={{ 
                    p: 2,
                    backgroundColor: 'background.paper',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={!isCollapsed}
                  aria-controls={`queue-${queue.seater}-content`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleQueueCollapse(queue.seater);
                    }
                  }}
                  onClick={() => toggleQueueCollapse(queue.seater)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {queue.seater}-Seater Queue
                    </Typography>
                    <Chip 
                      label={`${queue.cars.length} cars`} 
                      size="small"
                      sx={{
                        backgroundColor: queue.cars.length > 0 ? statusColors.badgeActive : statusColors.badgeEmpty,
                        color: queue.cars.length > 0 ? enhancedNeutral[50] : enhancedNeutral[350],
                        fontWeight: 600,
                        '&.MuiChip-root': {
                          border: 'none'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleClearQueue(queue.seater); }}
                      disabled={loading || queue.cars.length === 0}
                      sx={{ textTransform: 'none' }}
                      aria-label={`Clear ${queue.seater}-seater queue`}
                    >
                      Clear queue
                    </Button>
                    <Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
                      <IconButton size="small" aria-label={isCollapsed ? 'Expand section' : 'Collapse section'} sx={{ color: 'text.secondary' }}>
                        {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Collapsible Content */}
                <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
                  <Box id={`queue-${queue.seater}-content`} sx={{ p: 2, pt: 0 }}>
                    {queue.cars.length === 0 ? (
                      <Box sx={{ 
                        py: 4, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        opacity: 0.6
                      }}>
                        <DirectionsCarRoundedIcon sx={{ fontSize: '2rem', color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          No cars in {queue.seater}-seater queue
                        </Typography>
                      </Box>
                    ) : (
                      <Table size="small">
                        <TableHead>
                      <TableRow sx={{ backgroundColor: 'background.paper' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Position</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Plate No</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Driver</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Model</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Added At</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {queue.cars.map((car, index) => (
                            <TableRow 
                              key={`queue-car-${car.carId}`}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'action.hover'
                                },
                                borderLeft: '3px solid',
                                borderLeftColor: 
                                  index === 0 ? 'success.main' : 
                                  index === 1 ? 'warning.main' : 'divider'
                              }}
                            >
                              <TableCell>
                                <Chip 
                                  label={`#${index + 1}`} 
                                  size="small" 
                                  sx={{
                                    backgroundColor: 
                                      index === 0 ? statusColors.badgeActive : 
                                      index === 1 ? statusColors.badgeWarning : 
                                      statusColors.badgeInfo,
                                    color: enhancedNeutral[50],
                                    fontWeight: 600,
                                    border: 'none'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                                {car.plateNo}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>
                                {car.driverName}
                              </TableCell>
                              <TableCell>
                                {car.carModel}
                              </TableCell>
                              <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                                {new Date(car.timestampAdded).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}


      {activeTab === "queuepals" && (
        <Stack spacing={3}>
          {/* Add New Staff Member */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <PersonAddIcon color="primary" />
              <Typography variant="h6" sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                Add New Staff Member
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 3, color: enhancedNeutral[350] }}>
            </Typography>
            
            <Box component="form" onSubmit={handleAddStaff} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Username"
                    placeholder="queuepal01"
                    value={newStaff.username}
                    onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value.toLowerCase().trim() })}
                    fullWidth
                    required
                    size="medium"
                    autoComplete="username"
                    error={!newStaff.username.trim() && newStaff.username !== ""}
                    helperText={!newStaff.username.trim() && newStaff.username !== "" ? "Username is required" : ""}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name (Optional)"
                    placeholder="John Smith"
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    fullWidth
                    size="medium"
                    helperText=""
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number (Optional)"
                    placeholder="+91-XXXXX-XXXXX"
                    value={newStaff.contact}
                    onChange={(e) => setNewStaff({ ...newStaff, contact: e.target.value })}
                    fullWidth
                    size="medium"
                    helperText=""
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Password"
                    type={showNewStaffPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    fullWidth
                    required
                    size="medium"
                    autoComplete="new-password"
                    error={newStaff.password !== "" && newStaff.password.length < 6}
                    helperText={newStaff.password !== "" && newStaff.password.length < 6 ? "Password must be at least 6 characters" : ""}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                            edge="end"
                            aria-label={showNewStaffPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewStaffPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={loading}
                    size="large"
                    startIcon={<PersonAddIcon />}
                    sx={{ minWidth: 150 }}
                  >
                    {loading ? "Adding Staff..." : "Add Staff Member"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Staff Members List */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}>
                  Staff Members
                </Typography>
              <Chip 
                label={staffMembers.length} 
                size="small" 
                sx={{
                  backgroundColor: staffMembers.length > 0 ? statusColors.badgeActive : statusColors.badgeEmpty,
                  color: staffMembers.length > 0 ? enhancedNeutral[50] : enhancedNeutral[350],
                  fontWeight: 600,
                  border: 'none'
                }}
              />
              </Box>
              <Chip 
                label={`${staffMembers.filter(s => s.isActive).length} Active`} 
                size="small"
                sx={{
                  backgroundColor: statusColors.systemOnline,
                  color: enhancedNeutral[50],
                  fontWeight: 600,
                  border: 'none'
                }}
              />
            </Box>
            
            {staffMembers.length === 0 ? (
              <Box sx={{ 
                py: 6, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                opacity: 0.6
              }}>
                <PersonAddIcon sx={{ fontSize: '3rem', color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No Staff Members Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Add your first QueuePal staff member to get started with queue management.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="medium" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.paper' }}>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Password</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 100 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Created</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, minWidth: 160 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {staffMembers.map((staff) => {
                      const isEditing = editingStaffId === staff.id;
                      return (
                        <TableRow 
                          key={`staff-${staff.id}`}
                          sx={{
                            '&:hover': { backgroundColor: 'action.hover' },
                            backgroundColor: !staff.isActive ? 'action.disabledBackground' : 'inherit'
                          }}
                        >
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={editStaff.username}
                                onChange={(e) => setEditStaff({ ...editStaff, username: e.target.value.toLowerCase().trim() })}
                                sx={{ minWidth: 100 }}
                              />
                            ) : (
                              <Box sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                                {staff.username}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={editStaff.name}
                                onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                                sx={{ minWidth: 120 }}
                              />
                            ) : (
                              <Box sx={{ fontWeight: 500 }}>
                                {staff.name || <Typography component="em" sx={{ color: 'text.secondary', fontSize: '0.9em' }}>No name provided</Typography>}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={editStaff.contact}
                                onChange={(e) => setEditStaff({ ...editStaff, contact: e.target.value })}
                                sx={{ minWidth: 100 }}
                              />
                            ) : (
                              staff.contact || <Typography component="em" sx={{ color: 'text.secondary', fontSize: '0.9em' }}>No contact provided</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                type={showPasswords[staff.id] ? 'text' : 'password'}
                                value={editStaff.password}
                                onChange={(e) => setEditStaff({ ...editStaff, password: e.target.value })}
                                sx={{ minWidth: 120 }}
                                error={editStaff.password !== "" && editStaff.password.length < 6}
                                helperText={editStaff.password !== "" && editStaff.password.length < 6 ? "Min 6 characters" : ""}
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => togglePasswordVisibility(staff.id)}
                                        edge="end"
                                        aria-label={showPasswords[staff.id] ? 'Hide password' : 'Show password'}
                                      >
                                        {showPasswords[staff.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.875rem',
                                  bgcolor: 'background.paper',
                                  color: showPasswords[staff.id] ? 'text.primary' : 'text.disabled',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  px: 1.5,
                                  py: 0.5,
                                  borderRadius: 1,
                                  minWidth: 100,
                                  display: 'inline-block'
                                }}>
                                  {showPasswords[staff.id] ? staff.password : '••••••••'}
                                </Box>
                                <IconButton
                                  onClick={() => togglePasswordVisibility(staff.id)}
                                  sx={{ color: 'text.secondary' }}
                                  aria-label={showPasswords[staff.id] ? `Hide password for ${staff.username}` : `Show password for ${staff.username}`}
                                >
                                  {showPasswords[staff.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={staff.isActive ? "Active" : "Suspended"}
                              color={staff.isActive ? "success" : "error"}
                              size="small"
                              icon={staff.isActive ? <CheckCircleIcon /> : <BlockIcon />}
                              variant={staff.isActive ? "filled" : "outlined"}
                            />
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                            {new Date(staff.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell align="right">
                            {isEditing ? (
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Save Changes">
<IconButton 
                                    color="primary" 
                                    onClick={handleUpdateStaff} 
                                    disabled={loading}
                                    size="small"
                                    aria-label="Save staff changes"
                                  >
                                    <SaveRoundedIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
<IconButton onClick={cancelEditStaff} size="small" aria-label="Cancel staff editing">
                                    <CloseRoundedIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            ) : (
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Edit Staff">
<IconButton 
                                    color="info" 
                                    onClick={() => startEditStaff(staff)}
                                    size="small"
                                    aria-label={`Edit staff ${staff.username}`}
                                  >
                                    <EditRoundedIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={staff.isActive ? "Suspend Staff" : "Activate Staff"}>
<IconButton 
                                    color={staff.isActive ? "warning" : "success"}
                                    onClick={() => handleToggleStaffStatus(staff.id)}
                                    size="small"
                                    aria-label={staff.isActive ? `Suspend staff ${staff.username}` : `Activate staff ${staff.username}`}
                                  >
                                    {staff.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Staff">
<IconButton 
                                    color="error" 
                                    onClick={() => handleDeleteStaff(staff.id)}
                                    size="small"
                                    aria-label={`Delete staff ${staff.username}`}
                                  >
                                    <DeleteRoundedIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>

        </Stack>
      )}

      {activeTab === "database" && (
        <Stack spacing={2}>
          <DatabaseCleanup />
          
        </Stack>
      )}
      
      {/* Car Edit Dialog */}
      <CarEditDialog
        car={carToEdit}
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        onSave={handleSaveCarEdit}
        loading={loading}
      />
    </Box>
  );
};

export default AdminDashboard;
