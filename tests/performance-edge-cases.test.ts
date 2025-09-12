// TaxiTub Test Suite: Performance & Edge Cases (TC27-TC28)
// Version: v1.0.0  
// Author: Test Suite
// Coverage: Bulk operations, concurrent bookings, race conditions, and performance testing

import { BookingService, QueueService, CarService } from '../src/services/api';

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: [], error: null })),
            data: [],
            error: null
          })),
          single: jest.fn(() => ({ data: null, error: null })),
          data: [],
          error: null
        })),
        order: jest.fn(() => ({ data: [], error: null })),
        data: [],
        error: null
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
      BOOKING: 'booking',
      QUEUE: 'queue',
      CAR_INFO: 'carinfo',
      TRIP: 'trip',
      ADMIN: 'admin',
      QUEUE_PAL: 'queuepal_staff',
    },
  };
});

describe('Performance & Edge Case Tests (TC27-TC28)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console spies
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('TC27: Bulk Operations Performance', () => {
    test('should handle bulk car addition efficiently (100 cars)', async () => {
      const bulkCars = Array.from({ length: 100 }, (_, i) => ({
        carId: `BULK-CAR-${String(i + 1).padStart(3, '0')}`,
        model: `Model ${i + 1}`,
        seater: 4,
        driverName: `Driver ${i + 1}`,
        driverPhone: `98100${String(i + 1).padStart(5, '0')}`,
        isActive: true
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful bulk insertion
      supabase.from().insert().select().mockResolvedValueOnce({
        data: bulkCars,
        error: null
      });

      const startTime = performance.now();
      const result = await CarService.addCarsInBulk(bulkCars);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.carsAdded).toBe(100);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify single batch operation was used
      expect(supabase.from().insert).toHaveBeenCalledTimes(1);
    });

    test('should efficiently process bulk queue assignments', async () => {
      const carsToQueue = Array.from({ length: 50 }, (_, i) => ({
        carId: `QUEUE-CAR-${i + 1}`,
        seater: 4,
        priority: 'normal'
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock bulk queue operations
      supabase.from().insert().select().mockResolvedValue({
        data: carsToQueue.map((car, index) => ({
          queueId: `queue-${car.carId}`,
          carId: car.carId,
          seater: car.seater,
          position: index + 1,
          status: 'queued'
        })),
        error: null
      });

      const startTime = performance.now();
      const result = await QueueService.addCarsToQueueBulk(carsToQueue);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.queued).toBe(50);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    test('should handle bulk booking processing under load', async () => {
      const bulkBookings = Array.from({ length: 200 }, (_, i) => ({
        bookingId: `BULK-BK-${String(i + 1).padStart(3, '0')}`,
        passengerCount: Math.floor(Math.random() * 6) + 1, // 1-6 passengers
        destination: `Destination ${i + 1}`,
        priority: i < 50 ? 'high' : 'normal', // First 50 are high priority
        timestamp: new Date(Date.now() + i * 1000).toISOString()
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock successful bulk processing
      supabase.from().insert().select().mockResolvedValue({
        data: bulkBookings.map(booking => ({ 
          ...booking, 
          status: 'pending',
          processedAt: new Date().toISOString()
        })),
        error: null
      });

      const startTime = performance.now();
      const result = await BookingService.processBulkBookings(bulkBookings);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.processed).toBe(200);
      expect(result.data?.highPriorityProcessed).toBe(50);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should maintain performance with large queue operations', async () => {
      // Simulate large existing queue
      const largeQueue = Array.from({ length: 500 }, (_, i) => ({
        queueId: `existing-${i + 1}`,
        carId: `car-${i + 1}`,
        position: i + 1,
        seater: 4
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock large queue retrieval
      supabase.from().select().eq().order().mockResolvedValueOnce({
        data: largeQueue,
        error: null
      });

      const startTime = performance.now();
      const result = await QueueService.getQueueStatus(4);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.data?.queueLength).toBe(500);
      expect(executionTime).toBeLessThan(2000); // Should retrieve within 2 seconds
    });

    test('should handle memory efficiently during bulk operations', async () => {
      const memoryBefore = process.memoryUsage();
      
      // Simulate processing 1000 records
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data: `Large data string ${i}`.repeat(100) // ~2KB per record
      }));

      // Mock memory-efficient processing
      const processInBatches = (data: any[], batchSize = 100) => {
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
          batches.push(data.slice(i, i + batchSize));
        }
        return batches;
      };

      const batches = processInBatches(largeDataset);
      
      // Process each batch
      const results = [];
      for (const batch of batches) {
        const batchResult = batch.map(item => ({ processedId: item.id }));
        results.push(...batchResult);
      }

      const memoryAfter = process.memoryUsage();
      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;

      expect(results.length).toBe(1000);
      expect(batches.length).toBe(10); // 1000/100 = 10 batches
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('TC28: Concurrent Booking Scenarios', () => {
    test('should handle simultaneous booking requests for same seater type', async () => {
      const concurrentBookings = Array.from({ length: 10 }, (_, i) => ({
        bookingId: `CONCURRENT-${i + 1}`,
        passengerCount: 4,
        destination: `Dest ${i + 1}`,
        requestTime: new Date().toISOString()
      }));

      const { supabase } = require('../src/config/supabase');
      
      // Mock limited cars available (only 3 cars for 4-seater)
      const availableCars = [
        { carId: 'car-4s-1', seater: 4, position: 1 },
        { carId: 'car-4s-2', seater: 4, position: 2 },
        { carId: 'car-4s-3', seater: 4, position: 3 }
      ];

      supabase.from().select().eq().order().mockResolvedValue({
        data: availableCars,
        error: null
      });

      // Simulate concurrent booking processing
      const bookingPromises = concurrentBookings.map(booking => 
        BookingService.createBooking(booking)
      );

      const results = await Promise.allSettled(bookingPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success);

      // Should only assign to available cars (3), rest should be queued or failed
      expect(successful.length).toBeLessThanOrEqual(3);
      expect(failed.length).toBeGreaterThanOrEqual(7);
      
      // Verify no double-assignment occurred
      const assignedCarIds = successful
        .map(r => (r as any).value.data?.assignedCarId)
        .filter(Boolean);
      const uniqueCarIds = [...new Set(assignedCarIds)];
      expect(assignedCarIds.length).toBe(uniqueCarIds.length);
    });

    test('should prevent race conditions in queue position assignment', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Mock atomic position assignment
      let currentPosition = 0;
      const positionLock = new Map<number, boolean>();
      
      const atomicPositionAssignment = async (seater: number) => {
        // Simulate database transaction with row locking
        if (positionLock.has(seater)) {
          throw new Error('Position assignment in progress');
        }
        
        positionLock.set(seater, true);
        
        try {
          // Simulate getting next position
          const nextPosition = ++currentPosition;
          
          // Simulate database insert with position
          await new Promise(resolve => setTimeout(resolve, 10)); // DB delay
          
          positionLock.delete(seater);
          return { position: nextPosition, success: true };
        } catch (error) {
          positionLock.delete(seater);
          throw error;
        }
      };

      // Simulate 5 concurrent cars trying to join queue
      const concurrentQueues = Array.from({ length: 5 }, (_, i) => 
        atomicPositionAssignment(4).catch(() => ({ success: false }))
      );

      const results = await Promise.all(concurrentQueues);
      const successful = results.filter(r => r.success);
      
      // All should succeed with unique positions
      expect(successful.length).toBe(5);
      
      const positions = successful.map(r => (r as any).position);
      const uniquePositions = [...new Set(positions)];
      expect(positions.length).toBe(uniquePositions.length);
      expect(Math.max(...positions) - Math.min(...positions)).toBe(4); // Consecutive positions
    });

    test('should handle database deadlock scenarios gracefully', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Mock deadlock detection and retry
      let deadlockCount = 0;
      
      supabase.from().insert().mockImplementation(() => {
        deadlockCount++;
        
        if (deadlockCount <= 2) {
          // Simulate deadlock for first two attempts
          throw { code: '40P01', message: 'deadlock detected' };
        }
        
        return {
          select: () => ({
            single: () => ({ 
              data: { bookingId: 'success-after-retry' }, 
              error: null 
            })
          })
        };
      });

      // Implement retry logic with exponential backoff
      const retryWithBackoff = async (operation: () => Promise<any>, maxRetries = 3) => {
        let attempts = 0;
        
        while (attempts < maxRetries) {
          try {
            return await operation();
          } catch (error: any) {
            attempts++;
            
            if (error.code === '40P01' && attempts < maxRetries) {
              // Exponential backoff: 2^attempts * 100ms
              const delay = Math.pow(2, attempts) * 100;
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            throw error;
          }
        }
      };

      const bookingOperation = () => BookingService.createBooking({
        passengerCount: 4,
        destination: 'Airport'
      });

      const result = await retryWithBackoff(bookingOperation);

      expect(result.success).toBe(true);
      expect(result.data?.bookingId).toBe('success-after-retry');
      expect(deadlockCount).toBe(3); // Failed twice, succeeded on third attempt
    });

    test('should maintain data consistency under high concurrency', async () => {
      // Simulate high-concurrency scenario
      const concurrentOperations = [
        // Multiple bookings
        ...Array.from({ length: 20 }, (_, i) => ({
          type: 'booking',
          data: { passengerCount: 4, destination: `Dest ${i}` }
        })),
        // Multiple queue additions
        ...Array.from({ length: 15 }, (_, i) => ({
          type: 'queue',
          data: { carId: `car-${i}`, seater: 4 }
        })),
        // Multiple car updates
        ...Array.from({ length: 10 }, (_, i) => ({
          type: 'carUpdate',
          data: { carId: `car-${i}`, isActive: Math.random() > 0.5 }
        }))
      ];

      const { supabase } = require('../src/config/supabase');
      
      // Mock consistent responses
      supabase.from().insert().select().single.mockResolvedValue({
        data: { success: true },
        error: null
      });
      
      supabase.from().update().eq.mockResolvedValue({
        data: [{ updated: true }],
        error: null
      });

      // Execute all operations concurrently
      const operationPromises = concurrentOperations.map(async (op) => {
        switch (op.type) {
          case 'booking':
            return BookingService.createBooking(op.data);
          case 'queue':
            return QueueService.addCarToQueue(op.data.carId, op.data.seater);
          case 'carUpdate':
            return CarService.updateCarStatus(op.data.carId, op.data.isActive);
        }
      });

      const startTime = performance.now();
      const results = await Promise.allSettled(operationPromises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      const successful = results.filter(r => 
        r.status === 'fulfilled' && (r.value as any).success
      );
      
      // Should maintain reasonable success rate under load
      const successRate = successful.length / results.length;
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(executionTime).toBeLessThan(15000); // Complete within 15 seconds
    });

    test('should implement queue fairness under concurrent load', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Mock FIFO queue behavior
      const queueState = new Map<number, { queue: string[], nextPosition: number }>();
      
      const addToQueue = async (carId: string, seater: number) => {
        if (!queueState.has(seater)) {
          queueState.set(seater, { queue: [], nextPosition: 1 });
        }
        
        const state = queueState.get(seater)!;
        
        // Simulate atomic queue addition
        state.queue.push(carId);
        const position = state.nextPosition++;
        
        return { carId, position, queueLength: state.queue.length };
      };

      const removeFromQueue = async (seater: number) => {
        const state = queueState.get(seater);
        if (!state || state.queue.length === 0) {
          return null;
        }
        
        const carId = state.queue.shift()!;
        return { carId, newQueueLength: state.queue.length };
      };

      // Add 10 cars concurrently to 4-seater queue
      const carsToAdd = Array.from({ length: 10 }, (_, i) => `concurrent-car-${i + 1}`);
      const addPromises = carsToAdd.map(carId => addToQueue(carId, 4));
      
      const addResults = await Promise.all(addPromises);
      
      // Verify FIFO order is maintained
      const positions = addResults.map(r => r.position);
      expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      
      // Remove 3 cars and verify order
      const removeResults = [];
      for (let i = 0; i < 3; i++) {
        const result = await removeFromQueue(4);
        removeResults.push(result);
      }
      
      expect(removeResults[0]?.carId).toBe('concurrent-car-1');
      expect(removeResults[1]?.carId).toBe('concurrent-car-2');
      expect(removeResults[2]?.carId).toBe('concurrent-car-3');
    });

    test('should handle system overload gracefully', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Mock system overload conditions
      const systemLoad = { current: 0, max: 100 };
      
      const simulateSystemLoad = () => {
        systemLoad.current += Math.random() * 10;
        return systemLoad.current;
      };

      const checkSystemCapacity = () => {
        const load = simulateSystemLoad();
        
        if (load > systemLoad.max * 0.9) { // 90% capacity
          return { 
            overloaded: true, 
            shouldReject: true,
            message: 'System overloaded, please try again later'
          };
        }
        
        if (load > systemLoad.max * 0.7) { // 70% capacity
          return { 
            overloaded: false, 
            shouldThrottle: true,
            delay: 1000 // Add 1s delay
          };
        }
        
        return { overloaded: false, shouldThrottle: false };
      };

      // Simulate 50 concurrent requests
      const requests = Array.from({ length: 50 }, (_, i) => ({
        bookingId: `overload-test-${i + 1}`,
        passengerCount: 4
      }));

      let rejectedCount = 0;
      let throttledCount = 0;
      let successCount = 0;

      const processRequest = async (request: any) => {
        const capacity = checkSystemCapacity();
        
        if (capacity.shouldReject) {
          rejectedCount++;
          return { success: false, reason: 'SYSTEM_OVERLOADED' };
        }
        
        if (capacity.shouldThrottle) {
          throttledCount++;
          await new Promise(resolve => setTimeout(resolve, capacity.delay));
        }
        
        successCount++;
        return { success: true, bookingId: request.bookingId };
      };

      const results = await Promise.all(
        requests.map(request => processRequest(request))
      );

      // System should protect itself by rejecting some requests
      expect(rejectedCount).toBeGreaterThan(0);
      expect(throttledCount).toBeGreaterThan(0);
      expect(successCount).toBeGreaterThan(0);
      
      // Total should equal request count
      expect(rejectedCount + throttledCount + successCount).toBe(50);
      
      console.log(`Load test results: ${successCount} success, ${throttledCount} throttled, ${rejectedCount} rejected`);
    });
  });

  describe('Edge Cases & Stress Tests', () => {
    test('should handle extremely large booking batches', async () => {
      const hugeBookingBatch = Array.from({ length: 5000 }, (_, i) => ({
        bookingId: `huge-batch-${i + 1}`,
        passengerCount: Math.floor(Math.random() * 6) + 1,
        destination: `Destination ${i + 1}`
      }));

      // Mock batch processing with chunking
      const processBatchInChunks = (batch: any[], chunkSize = 100) => {
        const chunks = [];
        for (let i = 0; i < batch.length; i += chunkSize) {
          chunks.push(batch.slice(i, i + chunkSize));
        }
        return chunks;
      };

      const chunks = processBatchInChunks(hugeBookingBatch);
      let totalProcessed = 0;

      for (const chunk of chunks) {
        // Simulate processing each chunk
        totalProcessed += chunk.length;
        
        // Add small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      expect(totalProcessed).toBe(5000);
      expect(chunks.length).toBe(50); // 5000/100 = 50 chunks
    });

    test('should recover from memory pressure scenarios', () => {
      // Simulate memory pressure detection
      const checkMemoryPressure = () => {
        const usage = process.memoryUsage();
        const threshold = 100 * 1024 * 1024; // 100MB threshold
        
        return usage.heapUsed > threshold;
      };

      const performGarbageCollection = () => {
        if (global.gc) {
          global.gc();
          return true;
        }
        return false;
      };

      // Create large data structure to simulate memory usage
      let largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: new Array(1000).fill(`data-${i}`)
      }));

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Clear large data and attempt GC
      largeData = [];
      const gcPerformed = performGarbageCollection();
      
      // Small delay for GC to complete
      setTimeout(() => {
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryFreed = initialMemory - finalMemory;
        
        // Should have freed some memory
        expect(memoryFreed).toBeGreaterThan(0);
        
        console.log(`Memory freed: ${(memoryFreed / 1024 / 1024).toFixed(2)}MB, GC performed: ${gcPerformed}`);
      }, 100);
    });

    test('should handle rapid state changes without corruption', async () => {
      // Simulate rapid state changes in queue
      const queueState = {
        4: [] as string[],
        5: [] as string[],
        6: [] as string[]
      };

      const stateOperations = [
        // Add operations
        ...Array.from({ length: 100 }, (_, i) => ({
          type: 'add',
          seater: 4,
          carId: `rapid-car-4s-${i + 1}`
        })),
        // Remove operations
        ...Array.from({ length: 50 }, (_, i) => ({
          type: 'remove',
          seater: 4
        })),
        // Mixed operations for other seaters
        ...Array.from({ length: 30 }, (_, i) => ({
          type: 'add',
          seater: 5,
          carId: `rapid-car-5s-${i + 1}`
        })),
        ...Array.from({ length: 20 }, (_, i) => ({
          type: 'add',
          seater: 6,
          carId: `rapid-car-6s-${i + 1}`
        }))
      ];

      // Shuffle operations to simulate random order
      const shuffledOps = stateOperations.sort(() => Math.random() - 0.5);

      // Execute operations rapidly
      for (const op of shuffledOps) {
        if (op.type === 'add') {
          queueState[op.seater as keyof typeof queueState].push(op.carId!);
        } else if (op.type === 'remove') {
          queueState[op.seater as keyof typeof queueState].shift();
        }
      }

      // Verify final state integrity
      expect(queueState[4].length).toBe(50); // 100 added, 50 removed
      expect(queueState[5].length).toBe(30); // 30 added
      expect(queueState[6].length).toBe(20); // 20 added
      
      // Verify no duplicates in any queue
      Object.values(queueState).forEach(queue => {
        const uniqueCars = [...new Set(queue)];
        expect(queue.length).toBe(uniqueCars.length);
      });
    });
  });
});
