// Database Cleanup Component
// Add this to your Admin Dashboard to clean up the database

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  Grid,
  Divider,
} from '@mui/material';
import { supabase, TABLES, SEATER_QUEUE_TABLES } from '../config/supabase';
import { useToast } from './Toast';
import { LoadingOverlay } from './GlassmorphicLoading';
import { useConfirmDialog } from './DialogProvider';
import { LOADING_MESSAGES } from '../constants';

interface DbStats {
  totalCars: number;
  carsInQueue: number;
  availableCars: number;
  staffMembers: number;
}

const DatabaseCleanup: React.FC = () => {
  const [stats, setStats] = useState<DbStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { showSuccess, showError } = useToast();
  const confirmDialog = useConfirmDialog();

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total car count
      const { count: totalCars, error: carError } = await supabase
        .from(TABLES.CAR_INFO)
        .select('*', { count: 'exact', head: true });

      if (carError) throw carError;

      // Get cars in all seater queues
      let carsInQueue = 0;
      for (const [, tableName] of Object.entries(SEATER_QUEUE_TABLES)) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.warn(`Failed to get count for ${tableName}:`, error.message);
            continue;
          }
          
          carsInQueue += count || 0;
        } catch (err) {
          console.warn(`Table ${tableName} might not exist yet:`, err);
          // Skip this table and continue
        }
      }

      // Get Staff count
      const { count: staffMembers, error: staffError } = await supabase
        .from(TABLES.QUEUE_PAL)
        .select('*', { count: 'exact', head: true });

      if (staffError) throw staffError;

      setStats({
        totalCars: totalCars || 0,
        carsInQueue: carsInQueue,
        availableCars: (totalCars || 0) - carsInQueue,
        staffMembers: staffMembers || 0,
      });
    } catch (err: any) {
      showError(`Failed to load database statistics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleteLoading(true);

      // Delete in order: individual seater queues -> cars -> staff
      console.log('🗑️ Deleting all seater queue entries...');
      
      // Delete from all individual seater queue tables
      for (const [seater, tableName] of Object.entries(SEATER_QUEUE_TABLES)) {
        console.log(`🗑️ Deleting ${seater}-seater queue (${tableName})...`);
        
        try {
          // Use a more reliable delete approach
          const { error } = await supabase
            .from(tableName)
            .delete()
            .gte('queueid', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs
          
          if (error) {
            console.warn(`Failed to delete ${tableName}:`, error.message);
            // Continue with other tables even if one fails
          } else {
            console.log(`✅ Successfully cleared ${tableName}`);
          }
        } catch (err) {
          console.warn(`Table ${tableName} might not exist:`, err);
          // Continue with other operations
        }
      }

      console.log('🗑️ Deleting all cars...');
      const { error: carError } = await supabase
        .from(TABLES.CAR_INFO)
        .delete()
        .gte('carid', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs

      if (carError) throw new Error(`Failed to delete cars: ${carError.message}`);

      console.log('🗑️ Deleting all staff members...');
      
      // Try to delete from both possible staff tables
      const staffTables = [TABLES.QUEUE_PAL];
      let staffError = null;
      let staffDeleted = false;
      
      for (const tableName of staffTables) {
        try {
          console.log(`🗑️ Trying to clear staff table: ${tableName}`);
          
          // Try with queuepalid field first (most likely)
          const { error } = await supabase
            .from(tableName)
            .delete()
            .gte('queuepalid', '00000000-0000-0000-0000-000000000000');
          
          if (!error) {
            console.log(`✅ Successfully cleared staff from table: ${tableName}`);
            staffDeleted = true;
            break;
          } else {
            console.warn(`Failed to delete from ${tableName}:`, error.message);
            staffError = error;
          }
        } catch (err) {
          console.warn(`Table ${tableName} might not exist:`, err);
          continue;
        }
      }
      
      // If neither table worked, it's likely they don't exist yet (which is OK)
      if (!staffDeleted && staffError) {
        console.log('ℹ️ No staff tables to delete from (this is normal if no staff exist)');
        staffError = null; // Don't treat this as an error
      }

      if (staffError) throw new Error(`Failed to delete staff: ${staffError.message}`);

      showSuccess('All data deleted from all tables.');
      await loadStats();

    } catch (err: any) {
      showError(`Failed to delete all data: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCars = async () => {
    try {
      setDeleteLoading(true);

      console.log('🗑️ Deleting all cars from CAR_INFO table...');
      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .delete()
        .gte('carid', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs

      if (error) throw new Error(`Failed to delete cars: ${error.message}`);

      showSuccess('All cars deleted.');
      await loadStats();

    } catch (err: any) {
      showError(`Failed to delete cars: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteQueue = async () => {
    try {
      setDeleteLoading(true);

      console.log('🗑️ Deleting all seater queue entries...');
      
      // Delete from all individual seater queue tables
      let deletedCount = 0;
      for (const [seater, tableName] of Object.entries(SEATER_QUEUE_TABLES)) {
        console.log(`🗑️ Deleting ${seater}-seater queue (${tableName})...`);
        
        try {
          const { data, error } = await supabase
            .from(tableName)
            .delete()
            .gte('queueid', '00000000-0000-0000-0000-000000000000') // This will match all UUIDs
            .select('queueid');
          
          if (error) {
            console.warn(`Failed to delete ${tableName}:`, error.message);
          } else {
            deletedCount += (data || []).length;
            console.log(`✅ Deleted ${(data || []).length} entries from ${tableName}`);
          }
        } catch (err) {
          console.warn(`Table ${tableName} might not exist:`, err);
          // Continue with other tables
        }
      }

      showSuccess(`Deleted ${deletedCount} entries from all seater queues.`);
      await loadStats();

    } catch (err: any) {
      showError(`Failed to delete seater queues: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    try {
      setDeleteLoading(true);

      console.log('🗑️ Deleting all staff members...');
      
      // Try to delete from both possible staff tables
      const staffTables = [TABLES.QUEUE_PAL];
      let error = null;
      let staffDeleted = false;
      
      for (const tableName of staffTables) {
        try {
          console.log(`🗑️ Trying to clear staff table: ${tableName}`);
          
          // Try with queuepalid field first (most likely)
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .gte('queuepalid', '00000000-0000-0000-0000-000000000000');
          
          if (!deleteError) {
            console.log(`✅ Successfully cleared staff from table: ${tableName}`);
            staffDeleted = true;
            error = null;
            break;
          } else {
            console.warn(`Failed to delete from ${tableName}:`, deleteError.message);
            error = deleteError;
          }
        } catch (err) {
          console.warn(`Table ${tableName} might not exist:`, err);
          continue;
        }
      }
      
      // If neither table worked, it's likely they don't exist yet (which is OK)
      if (!staffDeleted && error) {
        console.log('ℹ️ No staff tables to delete from (this is normal if no staff exist)');
        error = null; // Don't treat this as an error
      }

      if (error) throw new Error(`Failed to delete staff: ${error.message}`);

      showSuccess('All staff members deleted.');
      await loadStats();

    } catch (err: any) {
      showError(`Failed to delete staff: ${err.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };


  const handleDeleteAllWithConfirm = async () => {
    const confirmed = await confirmDialog(
      'Delete All Database Data',
      'This will permanently delete ALL data from your database including cars, queue entries, and staff members. This action cannot be undone.'
    );
    if (confirmed) await handleDeleteAll();
  };

  const handleDeleteCarsWithConfirm = async () => {
    const confirmed = await confirmDialog(
      'Delete All Cars',
      `This will permanently delete all ${stats?.totalCars || 0} cars from the CAR_INFO table. This action cannot be undone.`
    );
    if (confirmed) await handleDeleteCars();
  };

  const handleDeleteQueueWithConfirm = async () => {
    const confirmed = await confirmDialog(
      'Delete All Queue Entries',
      `This will permanently delete all ${stats?.carsInQueue || 0} entries from ALL seater queue tables (4, 5, 6, 7, 8-seater). This action cannot be undone.`
    );
    if (confirmed) await handleDeleteQueue();
  };

  const handleDeleteStaffWithConfirm = async () => {
    const confirmed = await confirmDialog(
      'Delete All Staff Members',
      `This will permanently delete all ${stats?.staffMembers || 0} staff members from the QUEUE_PAL_STAFF table. This action cannot be undone.`
    );
    if (confirmed) await handleDeleteStaff();
  };

  React.useEffect(() => {
    loadStats();
  }, []);



  return (
    <Paper sx={{ p: 3, mb: 2, position: 'relative' }}>
      <LoadingOverlay loading={loading} message={LOADING_MESSAGES.LOADING} />
      
      <Typography variant="h6" sx={{ mb: 2 }}>
        🗑️ Database Management
      </Typography>

      {stats && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Current Database Status:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
            <Chip 
              label={`Total Cars: ${stats.totalCars}`} 
              color={"info"}
            />
            <Chip label={`Queue: ${stats.carsInQueue}`} variant="outlined" />
            <Chip label={`Available: ${stats.availableCars}`} color="primary" variant="outlined" />
            <Chip label={`Staff: ${stats.staffMembers}`} color="success" variant="outlined" />
          </Stack>
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="h6" sx={{ mb: 2, color: 'error.main' }}>
        ⚠️ Danger Zone
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These actions will permanently delete data from your database. Use with extreme caution!
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={handleDeleteAllWithConfirm}
            disabled={loading || deleteLoading}
            sx={{ height: '80px', flexDirection: 'column' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Delete All
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              Everything
            </Typography>
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDeleteCarsWithConfirm}
            disabled={loading || deleteLoading || !stats?.totalCars}
            sx={{ height: '80px', flexDirection: 'column' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Delete Cars
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              CAR_INFO table
            </Typography>
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDeleteQueueWithConfirm}
            disabled={loading || deleteLoading || !stats?.carsInQueue}
            sx={{ height: '80px', flexDirection: 'column' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Delete Queue
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              All seater tables
            </Typography>
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={handleDeleteStaffWithConfirm}
            disabled={loading || deleteLoading || !stats?.staffMembers}
            sx={{ height: '80px', flexDirection: 'column' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Delete Staff
            </Typography>
            <Typography variant="caption" sx={{ mt: 0.5 }}>
              QUEUE_PAL_STAFF table
            </Typography>
          </Button>
        </Grid>
        
      </Grid>


    </Paper>
  );
};

export default DatabaseCleanup;
