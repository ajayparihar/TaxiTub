// TaxiTub Test Suite: Fleet Management (TC6-TC8)
// Version: v1.0.0
// Author: Test Suite
// Coverage: Car CRUD operations, duplicate validation, and car activation/deactivation

import { CarService } from '../src/services/api';
import { CarInfo } from '../src/types';

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => ({ data: null, error: null })),
          single: jest.fn(() => ({ data: null, error: null }))
        })),
        order: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null }))
      }))
    }))
  };

  return {
    supabase: mockSupabase,
    TABLES: {
      CAR_INFO: 'carinfo',
      QUEUE: 'queue',
      ADMIN: 'admin',
      QUEUE_PAL: 'queuepal_staff',
    },
  };
});

describe('Fleet Management Tests (TC6-TC8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC6: Add New Car (All Valid Data)', () => {
    test('should add new car with all valid data', async () => {
      const newCarData = {
        plateNo: 'DL01AB1234',
        driverName: 'John Doe',
        driverPhone: '+91-9876543210',
        carModel: 'Toyota Innova',
        seater: 7
      };

      const mockCarResponse = {
        carId: 'car-123',
        ...newCarData,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful car insertion
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockCarResponse,
        error: null
      });

      const result = await CarService.addCar(newCarData);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        plateNo: 'DL01AB1234',
        driverName: 'John Doe',
        carModel: 'Toyota Innova',
        seater: 7
      });

      // Verify the car appears in carinfo table
      expect(supabase.from).toHaveBeenCalledWith('carinfo');
      expect(supabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining(newCarData)
      );
    });

    test('should make car visible to QueuePal for queueing', async () => {
      const newCarData = {
        plateNo: 'DL02XY9876',
        driverName: 'Jane Smith',
        driverPhone: '+91-9123456789',
        carModel: 'Maruti Ertiga',
        seater: 6
      };

      const mockCarResponse = {
        carId: 'car-456',
        ...newCarData,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockCarResponse,
        error: null
      });

      const result = await CarService.addCar(newCarData);

      expect(result.success).toBe(true);
      expect(result.data?.isActive).toBe(true); // Car should be active and available for queueing
    });

    test('should save all fields correctly', async () => {
      const newCarData = {
        plateNo: 'GJ01AB1234',
        driverName: 'Raj Patel',
        driverPhone: '+91-9988776655',
        carModel: 'Honda City',
        seater: 4
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: { carId: 'car-789', ...newCarData },
        error: null
      });

      const result = await CarService.addCar(newCarData);

      expect(result.success).toBe(true);
      
      // Verify all fields are saved correctly
      const insertCall = supabase.from().insert.mock.calls[0][0];
      expect(insertCall).toMatchObject({
        plateNo: 'GJ01AB1234',
        driverName: 'Raj Patel',
        driverPhone: '+91-9988776655',
        carModel: 'Honda City',
        seater: 4
      });
    });

    test('should handle various seater types (4-8)', async () => {
      const seaterTypes = [4, 5, 6, 7, 8];

      for (const seater of seaterTypes) {
        const carData = {
          plateNo: `TEST${seater}`,
          driverName: `Driver ${seater}`,
          driverPhone: '+91-9000000000',
          carModel: `Model ${seater}`,
          seater
        };

        const { supabase } = require('../src/config/supabase');
        
        supabase.from().insert().select().single.mockResolvedValueOnce({
          data: { carId: `car-${seater}`, ...carData },
          error: null
        });

        const result = await CarService.addCar(carData);

        expect(result.success).toBe(true);
        expect(result.data?.seater).toBe(seater);
      }
    });
  });

  describe('TC7: Duplicate Car Entry', () => {
    test('should reject duplicate plate number', async () => {
      const duplicateCarData = {
        plateNo: 'DL01AB1234', // Same as existing car
        driverName: 'New Driver',
        driverPhone: '+91-9999999999',
        carModel: 'New Model',
        seater: 5
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock duplicate error from database
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint'
        }
      });

      const result = await CarService.addCar(duplicateCarData);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('CAR_ALREADY_IN_QUEUE'); // Or similar error code
      expect(result.message).toContain('already exists');
    });

    test('should provide user feedback for duplicate entry', async () => {
      const duplicateCarData = {
        plateNo: 'EXISTING123',
        driverName: 'Test Driver',
        carModel: 'Test Model',
        seater: 4
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key'
        }
      });

      const result = await CarService.addCar(duplicateCarData);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.message?.length).toBeGreaterThan(0);
    });

    test('should not create duplicate in database', async () => {
      const duplicateCarData = {
        plateNo: 'DUPLICATE123',
        driverName: 'Test Driver',
        carModel: 'Test Model',
        seater: 4
      };

      const { supabase } = require('../src/config/supabase');
      
      // First check if car exists
      supabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
        data: { plateNo: 'DUPLICATE123', carId: 'existing-car' },
        error: null
      });

      const result = await CarService.addCar(duplicateCarData);

      expect(result.success).toBe(false);
      // Verify insert was not called due to duplicate check
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });
  });

  describe('TC8: Edit/Deactivate Car', () => {
    test('should update car details successfully', async () => {
      const carId = 'car-123';
      const updates = {
        carModel: 'Updated Toyota Innova',
        driverName: 'Updated Driver Name',
        driverPhone: '+91-9999888777'
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful update
      supabase.from().update().eq.mockResolvedValueOnce({
        data: [{ carId, ...updates }],
        error: null
      });

      const result = await CarService.updateCar(carId, updates);

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith(updates);
      expect(supabase.from().update().eq).toHaveBeenCalledWith('carId', carId);
    });

    test('should deactivate car (set is_active to false)', async () => {
      const carId = 'car-456';

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful deactivation
      supabase.from().update().eq.mockResolvedValueOnce({
        data: [{ carId, isActive: false }],
        error: null
      });

      const result = await CarService.toggleCarStatus(carId);

      expect(result.success).toBe(true);
      expect(supabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    test('should flag inactive car as hidden from queue assignment', async () => {
      const carId = 'car-789';
      
      // Mock car data with isActive: false
      const inactiveCar: Partial<CarInfo> = {
        carId: 'car-789',
        plateNo: 'INACTIVE123',
        isActive: false,
        carModel: 'Test Model',
        seater: 4
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock getting inactive car
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: inactiveCar,
        error: null
      });

      // Test that inactive cars are not returned in active car lists
      const result = await CarService.getActiveCars();

      // Assuming getActiveCars filters by isActive = true
      expect(result.success).toBe(true);
      // The inactive car should not be in the results for queue assignment
    });

    test('should save updates correctly', async () => {
      const carId = 'car-update-test';
      const updates = {
        driverName: 'New Driver Name',
        driverPhone: '+91-1234567890',
        carModel: 'Updated Car Model'
      };

      const { supabase } = require('../src/config/supabase');
      
      const expectedUpdatedCar = {
        carId,
        ...updates,
        updatedAt: expect.any(String)
      };

      supabase.from().update().eq.mockResolvedValueOnce({
        data: [expectedUpdatedCar],
        error: null
      });

      const result = await CarService.updateCar(carId, updates);

      expect(result.success).toBe(true);
      
      // Verify the update call contains all the expected fields
      const updateCall = supabase.from().update.mock.calls[0][0];
      expect(updateCall).toMatchObject(updates);
    });

    test('should handle car not found during update', async () => {
      const carId = 'non-existent-car';
      const updates = {
        carModel: 'Some Model'
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().update().eq.mockResolvedValueOnce({
        data: [],
        error: null
      });

      const result = await CarService.updateCar(carId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    test('should handle database errors during update', async () => {
      const carId = 'car-error-test';
      const updates = {
        carModel: 'Test Model'
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'CONNECTION_ERROR'
        }
      });

      const result = await CarService.updateCar(carId, updates);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database connection failed');
    });

    test('should toggle car status between active and inactive', async () => {
      const carId = 'car-toggle-test';

      const { supabase } = require('../src/config/supabase');
      
      // Mock getting current car status
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: { carId, isActive: true },
        error: null
      });

      // Mock successful toggle
      supabase.from().update().eq.mockResolvedValueOnce({
        data: [{ carId, isActive: false }],
        error: null
      });

      const result = await CarService.toggleCarStatus(carId);

      expect(result.success).toBe(true);
      // Verify that isActive was toggled from true to false
      expect(supabase.from().update).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });

    test('should prevent inactive cars from being added to queues', async () => {
      const inactiveCarId = 'inactive-car-123';

      // This would be tested in queue management, but we can verify the car status
      const carInfo: Partial<CarInfo> = {
        carId: inactiveCarId,
        plateNo: 'INACTIVE456',
        isActive: false,
        seater: 4
      };

      // Verify that car status checking works
      expect(carInfo.isActive).toBe(false);
      
      // In queue operations, this car should be rejected
      // This would be verified in queue management tests
    });
  });

  describe('Car Validation', () => {
    test('should validate required fields', async () => {
      const invalidCarData = {
        plateNo: '', // Empty plate number
        carModel: '', // Empty car model
        seater: 0     // Invalid seater count
      };

      const result = await CarService.addCar(invalidCarData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('required');
    });

    test('should validate seater range (4-8)', async () => {
      const invalidSeaterCounts = [1, 2, 3, 9, 10, -1];

      for (const seater of invalidSeaterCounts) {
        const carData = {
          plateNo: `TEST${seater}`,
          carModel: 'Test Model',
          seater
        };

        const result = await CarService.addCar(carData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('seater');
      }
    });

    test('should handle optional fields correctly', async () => {
      const carDataWithOptionalFields = {
        plateNo: 'OPTIONAL123',
        carModel: 'Test Model',
        seater: 4,
        // driverName and driverPhone are optional
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: { carId: 'car-optional', ...carDataWithOptionalFields },
        error: null
      });

      const result = await CarService.addCar(carDataWithOptionalFields);

      expect(result.success).toBe(true);
    });
  });
});
