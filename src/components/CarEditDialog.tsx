// TaxiTub Module: Car Edit Dialog Component
// Version: v1.0.0
// Last Updated: 2025-09-07
// Author: Bheb Developer
// Changelog: Modal dialog for editing car details in virtualized table

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { CarInfo } from '../types';

interface CarEditDialogProps {
  car: CarInfo | null;
  open: boolean;
  onClose: () => void;
  onSave: (carId: string, updates: Partial<CarInfo>) => Promise<void>;
  loading?: boolean;
}

const CarEditDialog: React.FC<CarEditDialogProps> = ({
  car,
  open,
  onClose,
  onSave,
  loading = false,
}) => {
  const [editData, setEditData] = useState({
    plateNo: '',
    driverName: '',
    driverPhone: '',
    carModel: '',
    seater: 4,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize edit data when car changes
  useEffect(() => {
    if (car) {
      setEditData({
        plateNo: car.plateNo,
        driverName: car.driverName || '',
        driverPhone: car.driverPhone || '',
        carModel: car.carModel,
        seater: car.seater,
      });
      setErrors({});
    }
  }, [car]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editData.plateNo.trim()) {
      newErrors['plateNo'] = 'Plate number is required';
    }
    
    if (!editData.carModel.trim()) {
      newErrors['carModel'] = 'Car model is required';
    }
    
    if (!editData.seater || editData.seater < 4 || editData.seater > 8) {
      newErrors['seater'] = 'Seater count must be between 4 and 8';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!car || !validateForm()) return;
    
    try {
      await onSave(car.carId, editData);
      onClose();
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  // Handle input change
  const handleChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!car) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6" component="span">
              Edit Car Details
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Update the details for vehicle <strong>{car.plateNo}</strong>
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plate Number"
              value={editData.plateNo}
              onChange={(e) => handleChange('plateNo', e.target.value)}
              error={!!errors['plateNo']}
              helperText={errors['plateNo']}
              required
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Driver Name"
              value={editData.driverName}
              onChange={(e) => handleChange('driverName', e.target.value)}
              disabled={loading}
              helperText="Optional - driver name"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Driver Phone"
              value={editData.driverPhone}
              onChange={(e) => handleChange('driverPhone', e.target.value)}
              disabled={loading}
              helperText="Optional - contact number"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Car Model"
              value={editData.carModel}
              onChange={(e) => handleChange('carModel', e.target.value)}
              error={!!errors['carModel']}
              helperText={errors['carModel']}
              required
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl 
              fullWidth 
              error={!!errors['seater']}
              disabled={loading}
            >
              <InputLabel>Seater Type</InputLabel>
              <Select
                value={editData.seater}
                onChange={(e) => handleChange('seater', parseInt(e.target.value as string))}
                label="Seater Type"
              >
                <MenuItem value={4}>4 Seater</MenuItem>
                <MenuItem value={5}>5 Seater</MenuItem>
                <MenuItem value={6}>6 Seater</MenuItem>
                <MenuItem value={7}>7 Seater</MenuItem>
                <MenuItem value={8}>8 Seater</MenuItem>
              </Select>
              {errors['seater'] && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors['seater']}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          color="inherit"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CarEditDialog;
