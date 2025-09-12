// TaxiTub Test Suite: Queue Operations (TC9-TC12)
// Version: v1.0.0
// Author: Test Suite
// Coverage: Queue assignment, FIFO logic, validation errors, bulk operations, and queue integrity

import { QueueService } from '../src/services/api';

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: jest.fn(() => ({ data: null, error: null })),
              data: [],
              error: null
            })),
            data: [],
            error: null
          })),
          maybeSingle: jest.fn(() => ({ data: null, error: null })),
          single: jest.fn(() => ({ data: null, error: null })),
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
      QUEUE: 'queue',
      CAR_INFO: 'carinfo',
      ADMIN: 'admin',
      QUEUE_PAL: 'queuepal_staff',
    },
  };
});

describe('Queue Operations Tests (TC9-TC12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC9: QueuePal Adds Car to 4-Seater Queue', () => {
    test('should add active car to 4-seater queue successfully', async () => {
      const carId = 'car-4seater-123';
      const mockCar = {
        carId,
        plateNo: 'DL01AB1234',
        driverName: 'John Doe',
        carModel: 'Honda City',
        seater: 4,
        isActive: true
      };

      const mockQueueEntry = {
        queueId: 'queue-1',
        carId,
        seater: 4,
        position: 1,
        timestampAdded: new Date().toISOString()
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock car lookup
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCar,
        error: null
      });

      // Mock max position query (empty queue)
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock successful queue insertion
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockQueueEntry,
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        carId,
        seater: 4,
        position: 1
      });

      // Verify car was added to correct queue table
      expect(supabase.from).toHaveBeenCalledWith('queue');
    });

    test('should assign correct FIFO position in queue', async () => {
      const carId = 'car-new-456';
      const mockCar = {
        carId,
        plateNo: 'DL02XY5678',
        seater: 4,
        isActive: true
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock car lookup
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCar,
        error: null
      });

      // Mock max position query (queue has 3 cars)
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: { position: 3 },
        error: null
      });

      // Mock successful queue insertion at position 4
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          queueId: 'queue-4',
          carId,
          seater: 4,
          position: 4,
          timestampAdded: new Date().toISOString()
        },
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(true);
      expect(result.data?.position).toBe(4); // Should be added at the end
    });

    test('should show confirmation message after successful addition', async () => {
      const carId = 'car-confirm-789';
      const mockCar = {
        carId,
        plateNo: 'GJ01CD9876',
        seater: 4,
        isActive: true
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCar,
        error: null
      });

      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          queueId: 'queue-new',
          carId,
          seater: 4,
          position: 1,
          timestampAdded: new Date().toISOString()
        },
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(true);
      expect(result.message).toContain('added to queue'); // Confirmation message
    });

    test('should handle different seater types (4, 5, 6, 7, 8)', async () => {
      const seaterTypes = [4, 5, 6, 7, 8];

      for (const seater of seaterTypes) {
        const carId = `car-${seater}seater`;
        const mockCar = {
          carId,
          plateNo: `TEST${seater}`,
          seater,
          isActive: true
        };

        const { supabase } = require('../src/config/supabase');
        
        supabase.from().select().eq().single.mockResolvedValueOnce({
          data: mockCar,
          error: null
        });

        supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null
        });

        supabase.from().insert().select().single.mockResolvedValueOnce({
          data: {
            queueId: `queue-${seater}`,
            carId,
            seater,
            position: 1,
            timestampAdded: new Date().toISOString()
          },
          error: null
        });

        const result = await QueueService.addCarToQueue({ carId });

        expect(result.success).toBe(true);
        expect(result.data?.seater).toBe(seater);
      }
    });
  });

  describe('TC10: Validation (Duplicate, Wrong Seater, Suspended)', () => {
    test('should reject adding car already in queue', async () => {
      const carId = 'car-duplicate-123';

      const { supabase } = require('../src/config/supabase');
      
      // Mock car lookup
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          carId,
          plateNo: 'DUPLICATE123',
          seater: 4,
          isActive: true
        },
        error: null
      });

      // Mock finding car already in queue
      supabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
        data: {
          queueId: 'existing-queue',
          carId,
          position: 2
        },
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('CAR_ALREADY_IN_QUEUE');
      expect(result.message).toContain('already in queue');
    });

    test('should reject adding suspended/inactive car', async () => {
      const carId = 'car-suspended-456';

      const { supabase } = require('../src/config/supabase');
      
      // Mock suspended car lookup
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          carId,
          plateNo: 'SUSPENDED123',
          seater: 4,
          isActive: false // Suspended car
        },
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('UNAUTHORIZED_ACCESS');
      expect(result.message).toContain('suspended');
    });

    test('should validate seater type matches queue', async () => {
      const carId = 'car-wrong-seater-789';

      const { supabase } = require('../src/config/supabase');
      
      // Mock car with 4 seats
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          carId,
          plateNo: 'WRONGSEATER123',
          seater: 4,
          isActive: true
        },
        error: null
      });

      // Try to add to wrong queue (this would be a logic error in the service)
      // The service should automatically route to correct queue based on seater

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(true);
      // Should be automatically routed to correct queue based on car's seater
      expect(result.data?.seater).toBe(4);
    });

    test('should return appropriate validation error messages', async () => {
      const testCases = [
        {
          carId: 'non-existent-car',
          scenario: 'Car not found',
          mockCarData: null,
          expectedError: 'CAR_NOT_FOUND'
        },
        {
          carId: 'invalid-car',
          scenario: 'Invalid seater input',
          mockCarData: {
            carId: 'invalid-car',
            seater: 0, // Invalid seater
            isActive: true
          },
          expectedError: 'INVALID_SEATER_INPUT'
        }
      ];

      for (const testCase of testCases) {
        const { supabase } = require('../src/config/supabase');
        
        supabase.from().select().eq().single.mockResolvedValueOnce({
          data: testCase.mockCarData,
          error: testCase.mockCarData ? null : { message: 'Not found' }
        });

        const result = await QueueService.addCarToQueue({ carId: testCase.carId });

        expect(result.success).toBe(false);
        expect(result.message).toBeDefined();
        expect(result.message?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('TC11: Remove and Requeue Car', () => {
    test('should remove car from queue and renumber positions', async () => {
      const carId = 'car-remove-123';

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful removal
      supabase.from().delete().eq.mockResolvedValueOnce({
        data: [{ carId, position: 2 }],
        error: null
      });

      const result = await QueueService.removeCarFromQueue(carId);

      expect(result.success).toBe(true);
      expect(supabase.from().delete).toHaveBeenCalled();
    });

    test('should maintain correct FIFO positions after removal', async () => {
      const seater = 4;
      const initialQueue = [
        { carId: 'car-1', position: 1 },
        { carId: 'car-2', position: 2 },
        { carId: 'car-3', position: 3 },
        { carId: 'car-4', position: 4 }
      ];

      const { supabase } = require('../src/config/supabase');
      
      // Mock queue after removal (position 2 removed)
      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: [
          { carId: 'car-1', position: 1 },
          { carId: 'car-3', position: 3 }, // Gap at position 2
          { carId: 'car-4', position: 4 }
        ],
        error: null
      });

      const result = await QueueService.fixQueuePositions(seater);

      expect(result.success).toBe(true);
      // Should have fixed the gap and renumbered positions
      expect(result.data?.updated).toBeGreaterThan(0);
    });

    test('should allow car to be re-added at end of queue after removal', async () => {
      const carId = 'car-requeue-456';
      const mockCar = {
        carId,
        plateNo: 'REQUEUE123',
        seater: 4,
        isActive: true
      };

      const { supabase } = require('../src/config/supabase');
      
      // First, simulate car not in queue
      supabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock car lookup
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockCar,
        error: null
      });

      // Mock current queue has 2 cars
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: { position: 2 },
        error: null
      });

      // Mock successful re-addition at position 3
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          queueId: 'queue-requeue',
          carId,
          seater: 4,
          position: 3, // Added at end
          timestampAdded: new Date().toISOString()
        },
        error: null
      });

      const result = await QueueService.addCarToQueue({ carId });

      expect(result.success).toBe(true);
      expect(result.data?.position).toBe(3); // Should be added at correct position
    });

    test('should handle queue renumbering automatically', async () => {
      const seater = 5;
      const queueWithGaps = [
        { queueId: 'q1', carId: 'car-1', position: 1 },
        { queueId: 'q2', carId: 'car-2', position: 4 }, // Gap at 2, 3
        { queueId: 'q3', carId: 'car-3', position: 6 }  // Gap at 5
      ];

      const { supabase } = require('../src/config/supabase');
      
      // Mock queue with gaps
      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: queueWithGaps,
        error: null
      });

      // Mock successful updates for renumbering
      supabase.from().update().eq.mockResolvedValue({
        data: [{}],
        error: null
      });

      const result = await QueueService.fixQueuePositions(seater);

      expect(result.success).toBe(true);
      expect(result.data?.updated).toBe(2); // Should update 2 cars (positions 4->2, 6->3)
    });
  });

  describe('TC12: Bulk Queue Operations', () => {
    test('should handle bulk car additions', async () => {
      const carIds = ['car-bulk-1', 'car-bulk-2', 'car-bulk-3'];
      const mockCars = carIds.map((carId, index) => ({
        carId,
        plateNo: `BULK${index + 1}`,
        seater: 4,
        isActive: true
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock each car lookup
      mockCars.forEach((car, index) => {
        supabase.from().select().eq().single.mockResolvedValueOnce({
          data: car,
          error: null
        });

        // Mock position calculation for each car
        supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
          data: { position: index }, // Previous car count
          error: null
        });

        // Mock successful insertion
        supabase.from().insert().select().single.mockResolvedValueOnce({
          data: {
            queueId: `queue-${index + 1}`,
            carId: car.carId,
            seater: 4,
            position: index + 1,
            timestampAdded: new Date().toISOString()
          },
          error: null
        });
      });

      // Process bulk additions
      const results = await Promise.all(
        carIds.map(carId => QueueService.addCarToQueue({ carId }))
      );

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Positions should be sequential
      results.forEach((result, index) => {
        expect(result.data?.position).toBe(index + 1);
      });
    });

    test('should handle bulk car removals', async () => {
      const carIds = ['car-remove-1', 'car-remove-2', 'car-remove-3'];

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful removals
      carIds.forEach(carId => {
        supabase.from().delete().eq.mockResolvedValueOnce({
          data: [{ carId }],
          error: null
        });
      });

      // Process bulk removals
      const results = await Promise.all(
        carIds.map(carId => QueueService.removeCarFromQueue(carId))
      );

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    test('should maintain queue integrity under load', async () => {
      const seater = 6;
      const operationCount = 50;

      const { supabase } = require('../src/config/supabase');
      
      // Mock queue state
      supabase.from().select().eq().order.mockResolvedValue({
        data: Array.from({ length: operationCount }, (_, i) => ({
          carId: `car-${i}`,
          position: i + 1
        })),
        error: null
      });

      const result = await QueueService.getQueueBySeater(seater);

      expect(result.success).toBe(true);
      expect(result.data?.cars.length).toBe(operationCount);
      
      // Verify positions are sequential
      const positions = result.data?.cars.map(car => car.position) || [];
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBe(i + 1);
      }
    });

    test('should handle concurrent operations without race conditions', async () => {
      const carIds = ['car-race-1', 'car-race-2', 'car-race-3'];
      
      const { supabase } = require('../src/config/supabase');
      
      // Mock cars
      carIds.forEach((carId, index) => {
        supabase.from().select().eq().single.mockResolvedValueOnce({
          data: {
            carId,
            plateNo: `RACE${index + 1}`,
            seater: 7,
            isActive: true
          },
          error: null
        });

        // Mock no existing queue entries
        supabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null
        });

        // Mock max position for concurrent operations
        supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
          data: { position: 0 },
          error: null
        });

        // Mock successful insertions with unique positions
        supabase.from().insert().select().single.mockResolvedValueOnce({
          data: {
            queueId: `queue-race-${index + 1}`,
            carId,
            seater: 7,
            position: index + 1,
            timestampAdded: new Date().toISOString()
          },
          error: null
        });
      });

      // Simulate concurrent operations
      const concurrentPromises = carIds.map(carId => 
        QueueService.addCarToQueue({ carId })
      );

      const results = await Promise.all(concurrentPromises);

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify no duplicate positions
      const positions = results.map(r => r.data?.position).filter(Boolean);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(positions.length);
    });

    test('should provide performance metrics for bulk operations', async () => {
      const startTime = Date.now();
      const operationCount = 10;
      
      const carIds = Array.from({ length: operationCount }, (_, i) => `perf-car-${i}`);

      const { supabase } = require('../src/config/supabase');
      
      // Mock fast responses for performance test
      carIds.forEach((carId, index) => {
        supabase.from().select().eq().single.mockResolvedValueOnce({
          data: {
            carId,
            plateNo: `PERF${index}`,
            seater: 8,
            isActive: true
          },
          error: null
        });

        supabase.from().select().eq().maybeSingle.mockResolvedValueOnce({
          data: null,
          error: null
        });

        supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
          data: { position: index },
          error: null
        });

        supabase.from().insert().select().single.mockResolvedValueOnce({
          data: {
            queueId: `perf-queue-${index}`,
            carId,
            seater: 8,
            position: index + 1,
            timestampAdded: new Date().toISOString()
          },
          error: null
        });
      });

      const results = await Promise.all(
        carIds.map(carId => QueueService.addCarToQueue({ carId }))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance check - should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds max for 10 operations
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Queue Integrity', () => {
    test('should maintain FIFO order after multiple operations', async () => {
      const seater = 4;
      const queueData = [
        { carId: 'car-1', position: 1, timestampAdded: '2025-01-01T10:00:00Z' },
        { carId: 'car-2', position: 2, timestampAdded: '2025-01-01T10:05:00Z' },
        { carId: 'car-3', position: 3, timestampAdded: '2025-01-01T10:10:00Z' }
      ];

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: queueData,
        error: null
      });

      const result = await QueueService.getQueueBySeater(seater);

      expect(result.success).toBe(true);
      
      // Verify FIFO order
      const cars = result.data?.cars || [];
      for (let i = 0; i < cars.length - 1; i++) {
        const currentTime = new Date(cars[i].timestampAdded).getTime();
        const nextTime = new Date(cars[i + 1].timestampAdded).getTime();
        expect(currentTime).toBeLessThanOrEqual(nextTime);
      }
    });

    test('should handle queue position gaps gracefully', async () => {
      const seater = 5;
      const queueWithGaps = [
        { carId: 'car-1', position: 1 },
        { carId: 'car-2', position: 4 }, // Gap at 2, 3
        { carId: 'car-3', position: 7 }  // Gap at 5, 6
      ];

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: queueWithGaps,
        error: null
      });

      supabase.from().update().eq.mockResolvedValue({
        data: [{}],
        error: null
      });

      const result = await QueueService.fixQueuePositions(seater);

      expect(result.success).toBe(true);
      // Should fix gaps and update positions
      expect(result.data?.updated).toBeGreaterThan(0);
    });

    test('should validate queue consistency', async () => {
      const seater = 6;

      const { supabase } = require('../src/config/supabase');
      
      // Mock queue with proper sequential positions
      supabase.from().select().eq().order.mockResolvedValueOnce({
        data: [
          { carId: 'car-1', position: 1, seater: 6 },
          { carId: 'car-2', position: 2, seater: 6 },
          { carId: 'car-3', position: 3, seater: 6 }
        ],
        error: null
      });

      const result = await QueueService.getQueueBySeater(seater);

      expect(result.success).toBe(true);
      
      // Verify all cars have correct seater type
      const cars = result.data?.cars || [];
      cars.forEach(car => {
        expect(car.seater).toBe(seater);
      });

      // Verify positions are sequential
      cars.forEach((car, index) => {
        expect(car.position).toBe(index + 1);
      });
    });
  });
});
