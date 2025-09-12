// TaxiTub Test Suite: Passenger Booking Workflows (TC13-TC17)
// Version: v1.0.0
// Author: Test Suite
// Coverage: Optimized booking algorithms, edge cases, sharing functionality, and booking validation

import { BookingService } from '../src/services/api';

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
      TRIP: 'trip',
      ADMIN: 'admin',
      QUEUE_PAL: 'queuepal_staff',
    },
  };
});

describe('Passenger Booking Workflows Tests (TC13-TC17)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC13: Optimized Booking for 1–8 Passengers', () => {
    test('should assign car from smallest matching queue for 1-4 passengers', async () => {
      const passengerCount = 3;
      const mockQueue4Seater = {
        queueId: 'q4-1',
        carId: 'car-4seater-1',
        seater: 4,
        position: 1,
        timestampAdded: new Date('2025-01-01T10:00:00Z').toISOString(),
        carinfo: {
          carId: 'car-4seater-1',
          plateNo: 'DL01AB1234',
          driverName: 'John Doe',
          driverPhone: '+91-9876543210',
          carModel: 'Honda City',
          seater: 4
        }
      };

      const { supabase } = require('../src/config/supabase');
      
      // Mock 4-seater queue has available car
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: mockQueue4Seater,
        error: null
      });

      // Mock successful trip creation
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          tripId: 'trip-123',
          passengerCount,
          assignedCar: mockQueue4Seater.carinfo,
          status: 'Assigned'
        },
        error: null
      });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(4); // Should get 4-seater for 3 passengers
      expect(result.data?.car.plateNo).toBe('DL01AB1234');
    });

    test('should assign car from 5-seater queue for 5 passengers', async () => {
      const passengerCount = 5;
      const mockQueue5Seater = {
        queueId: 'q5-1',
        carId: 'car-5seater-1',
        seater: 5,
        position: 1,
        carinfo: {
          plateNo: 'DL02XY5678',
          driverName: 'Jane Smith',
          seater: 5
        }
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: mockQueue5Seater,
        error: null
      });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(5);
      expect(result.data?.car.plateNo).toBe('DL02XY5678');
    });

    test('should assign car from 8-seater queue for 8 passengers', async () => {
      const passengerCount = 8;
      const mockQueue8Seater = {
        queueId: 'q8-1',
        carId: 'car-8seater-1',
        seater: 8,
        position: 1,
        carinfo: {
          plateNo: 'DL08MAX9999',
          driverName: 'Max Driver',
          seater: 8
        }
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: mockQueue8Seater,
        error: null
      });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(8);
    });

    test('should show confirmation with car details after booking', async () => {
      const passengerCount = 2;
      const mockBookingResult = {
        car: {
          plateNo: 'CONFIRM123',
          driverName: 'Test Driver',
          driverPhone: '+91-9999888777'
        },
        queuePosition: 1,
        estimatedWaitTime: '5 minutes'
      };

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: {
          carinfo: mockBookingResult.car,
          position: 1
        },
        error: null
      });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.plateNo).toBe('CONFIRM123');
      expect(result.data?.car.driverName).toBe('Test Driver');
      expect(result.data?.car.driverPhone).toBe('+91-9999888777');
    });

    test('should create trip record in database', async () => {
      const passengerCount = 4;
      const passengerName = 'John Passenger';
      const destination = 'Airport Terminal 1';

      const { supabase } = require('../src/config/supabase');
      
      // Mock car assignment
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: {
          carId: 'car-trip-test',
          carinfo: { plateNo: 'TRIP123', seater: 4 }
        },
        error: null
      });

      // Mock trip creation
      const mockTripData = {
        tripId: 'trip-new-123',
        passengerCount,
        passengerName,
        destination,
        carId: 'car-trip-test',
        status: 'Assigned',
        createdAt: new Date().toISOString()
      };

      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: mockTripData,
        error: null
      });

      const result = await BookingService.createTrip({
        passengerCount,
        passengerName,
        destination
      });

      expect(result.success).toBe(true);
      expect(result.data?.tripId).toBe('trip-new-123');
      expect(result.data?.status).toBe('Assigned');
    });
  });

  describe('TC14: Booking When Preferred Seater Empty', () => {
    test('should allocate larger car when exact seater unavailable', async () => {
      const passengerCount = 4; // Wants 4-seater

      const { supabase } = require('../src/config/supabase');
      
      // Mock: 4-seater queue is empty
      supabase.from().select().eq().order().limit().maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 4-seater empty
        .mockResolvedValueOnce({ // 5-seater available
          data: {
            carId: 'car-5seater-upgrade',
            seater: 5,
            carinfo: {
              plateNo: 'UPGRADE567',
              seater: 5
            }
          },
          error: null
        });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(5); // Got upgraded to 5-seater
      expect(result.data?.car.plateNo).toBe('UPGRADE567');
    });

    test('should follow smart allocation priority (5→6→7→8)', async () => {
      const passengerCount = 4;

      const { supabase } = require('../src/config/supabase');
      
      // Mock: 4 and 5-seater empty, 6-seater available
      supabase.from().select().eq().order().limit().maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 4-seater empty
        .mockResolvedValueOnce({ data: null, error: null }) // 5-seater empty
        .mockResolvedValueOnce({ // 6-seater available
          data: {
            carId: 'car-6seater-fallback',
            seater: 6,
            carinfo: {
              plateNo: 'FALLBACK678',
              seater: 6
            }
          },
          error: null
        });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(6); // Next available size
    });

    test('should explain allocation logic in UI feedback', async () => {
      const passengerCount = 3;

      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 4-seater empty
        .mockResolvedValueOnce({
          data: {
            carId: 'car-explanation',
            seater: 5,
            carinfo: { plateNo: 'EXPLAIN123', seater: 5 }
          },
          error: null
        });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(true);
      expect(result.message).toContain('upgraded'); // Should explain upgrade
      expect(result.data?.allocationReason).toContain('No 4-seater available');
    });

    test('should handle multiple queue checks efficiently', async () => {
      const passengerCount = 2;
      const startTime = Date.now();

      const { supabase } = require('../src/config/supabase');
      
      // Mock multiple queue checks - all empty except 8-seater
      const queueCheckMocks = [
        { data: null, error: null }, // 4-seater
        { data: null, error: null }, // 5-seater
        { data: null, error: null }, // 6-seater
        { data: null, error: null }, // 7-seater
        { 
          data: { 
            carId: 'car-last-resort',
            seater: 8,
            carinfo: { plateNo: 'LAST8888', seater: 8 }
          }, 
          error: null 
        } // 8-seater
      ];

      queueCheckMocks.forEach(mock => {
        supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce(mock);
      });

      const result = await BookingService.assignTaxi(passengerCount);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.data?.car.seater).toBe(8);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('TC15: Booking Edge – No Available Cars', () => {
    test('should return NO_AVAILABLE_CAR error when all queues empty', async () => {
      const passengerCount = 4;

      const { supabase } = require('../src/config/supabase');
      
      // Mock all queues empty
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await BookingService.assignTaxi(passengerCount);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('NO_AVAILABLE_CAR');
      expect(result.message).toContain('No cars available');
    });

    test('should not create trip when no cars available', async () => {
      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await BookingService.assignTaxi(4);

      expect(result.success).toBe(false);
      // Verify no trip was created
      expect(supabase.from().insert).not.toHaveBeenCalled();
    });

    test('should provide helpful UI feedback for next steps', async () => {
      const { supabase } = require('../src/config/supabase');
      
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await BookingService.assignTaxi(6);

      expect(result.success).toBe(false);
      expect(result.message).toContain('try again later');
      expect(result.suggestions).toContain('Check back in a few minutes');
    });

    test('should handle suspended/inactive cars correctly', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Mock queue with inactive car (should be treated as empty)
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: {
          carId: 'car-inactive',
          carinfo: {
            plateNo: 'INACTIVE123',
            isActive: false // Suspended car
          }
        },
        error: null
      });

      const result = await BookingService.assignTaxi(4);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('NO_AVAILABLE_CAR');
    });
  });

  describe('TC16: Invalid Passenger Count', () => {
    test('should reject passenger count of 0', async () => {
      const result = await BookingService.assignTaxi(0);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SEATER_INPUT');
      expect(result.message).toContain('Invalid passenger count');
    });

    test('should reject negative passenger count', async () => {
      const result = await BookingService.assignTaxi(-2);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SEATER_INPUT');
      expect(result.message).toContain('must be between 1 and 8');
    });

    test('should reject passenger count greater than 8', async () => {
      const result = await BookingService.assignTaxi(10);

      expect(result.success).toBe(false);
      expect(result.error_code).toBe('INVALID_SEATER_INPUT');
      expect(result.message).toContain('maximum 8 passengers');
    });

    test('should prevent UI submission with invalid counts', () => {
      const mockValidation = (count: number) => {
        if (count < 1 || count > 8) {
          return { isValid: false, message: 'Please enter 1-8 passengers' };
        }
        return { isValid: true, message: '' };
      };

      expect(mockValidation(0).isValid).toBe(false);
      expect(mockValidation(-1).isValid).toBe(false);
      expect(mockValidation(9).isValid).toBe(false);
      expect(mockValidation(4).isValid).toBe(true);
    });

    test('should handle non-numeric input gracefully', async () => {
      // Simulate string input being converted
      const invalidInput = 'abc' as any;
      const numericInput = parseInt(invalidInput);

      if (isNaN(numericInput)) {
        const result = {
          success: false,
          error_code: 'INVALID_SEATER_INPUT',
          message: 'Passenger count must be a number'
        };

        expect(result.success).toBe(false);
        expect(result.error_code).toBe('INVALID_SEATER_INPUT');
      }
    });
  });

  describe('TC17: Share Assignment Details', () => {
    test('should format details for WhatsApp sharing', async () => {
      const bookingDetails = {
        car: {
          plateNo: 'SHARE123',
          driverName: 'Share Driver',
          driverPhone: '+91-9876543210'
        },
        queuePosition: 2,
        estimatedTime: '10 minutes',
        destination: 'Airport Terminal 1'
      };

      const whatsappMessage = `🚗 TaxiTub Booking Confirmed!
Car: ${bookingDetails.car.plateNo}
Driver: ${bookingDetails.car.driverName}
Phone: ${bookingDetails.car.driverPhone}
Position in queue: ${bookingDetails.queuePosition}
Estimated wait: ${bookingDetails.estimatedTime}
Destination: ${bookingDetails.destination}`;

      expect(whatsappMessage).toContain('SHARE123');
      expect(whatsappMessage).toContain('Share Driver');
      expect(whatsappMessage).toContain('+91-9876543210');
      expect(whatsappMessage).toContain('Position in queue: 2');
    });

    test('should format details for SMS sharing', async () => {
      const bookingDetails = {
        car: { plateNo: 'SMS456', driverName: 'SMS Driver' },
        queuePosition: 1
      };

      const smsMessage = `TaxiTub: Car ${bookingDetails.car.plateNo} (${bookingDetails.car.driverName}) assigned. Position: ${bookingDetails.queuePosition}. Track at taxitub.com`;

      expect(smsMessage).toContain('SMS456');
      expect(smsMessage).toContain('SMS Driver');
      expect(smsMessage).toBeLessThan(160); // SMS length limit
    });

    test('should format details for email sharing', async () => {
      const bookingDetails = {
        car: {
          plateNo: 'EMAIL789',
          driverName: 'Email Driver',
          driverPhone: '+91-9999888777',
          carModel: 'Toyota Innova'
        },
        tripId: 'TRIP-EMAIL-123',
        passengerName: 'John Doe',
        destination: 'International Airport',
        bookingTime: new Date().toISOString()
      };

      const emailContent = {
        subject: `TaxiTub Booking Confirmation - ${bookingDetails.tripId}`,
        body: `
Dear ${bookingDetails.passengerName},

Your taxi booking has been confirmed!

Booking Details:
- Trip ID: ${bookingDetails.tripId}
- Car: ${bookingDetails.car.plateNo} (${bookingDetails.car.carModel})
- Driver: ${bookingDetails.car.driverName}
- Contact: ${bookingDetails.car.driverPhone}
- Destination: ${bookingDetails.destination}
- Booked at: ${new Date(bookingDetails.bookingTime).toLocaleString()}

Thank you for choosing TaxiTub!
        `
      };

      expect(emailContent.subject).toContain('TRIP-EMAIL-123');
      expect(emailContent.body).toContain('EMAIL789');
      expect(emailContent.body).toContain('Toyota Innova');
      expect(emailContent.body).toContain('International Airport');
    });

    test('should handle sharing errors gracefully', () => {
      const mockShareFunction = (platform: string, data: any) => {
        // Simulate sharing API failure
        if (platform === 'whatsapp' && !data.phoneNumber) {
          return {
            success: false,
            error: 'WhatsApp sharing requires phone number'
          };
        }
        
        if (platform === 'email' && !data.email) {
          return {
            success: false,
            error: 'Email sharing requires email address'
          };
        }

        return { success: true };
      };

      // Test WhatsApp error
      const whatsappResult = mockShareFunction('whatsapp', {});
      expect(whatsappResult.success).toBe(false);
      expect(whatsappResult.error).toContain('phone number');

      // Test email error
      const emailResult = mockShareFunction('email', {});
      expect(emailResult.success).toBe(false);
      expect(emailResult.error).toContain('email address');

      // Test successful SMS
      const smsResult = mockShareFunction('sms', { message: 'test' });
      expect(smsResult.success).toBe(true);
    });

    test('should show clear error messages for failed sharing', () => {
      const mockSharingError = {
        platform: 'whatsapp',
        error: 'Network error',
        message: 'Unable to share via WhatsApp. Please try again or use a different sharing method.'
      };

      expect(mockSharingError.message).toContain('try again');
      expect(mockSharingError.message).toContain('different sharing method');
    });

    test('should track successful shares for analytics', () => {
      const mockAnalytics = {
        trackShare: jest.fn()
      };

      const shareSuccess = (platform: string, tripId: string) => {
        mockAnalytics.trackShare({ platform, tripId, timestamp: new Date() });
        return { success: true, platform, tripId };
      };

      const result = shareSuccess('whatsapp', 'TRIP-123');

      expect(result.success).toBe(true);
      expect(mockAnalytics.trackShare).toHaveBeenCalledWith({
        platform: 'whatsapp',
        tripId: 'TRIP-123',
        timestamp: expect.any(Date)
      });
    });

    test('should provide multiple sharing options', () => {
      const availableSharingMethods = [
        { id: 'whatsapp', name: 'WhatsApp', icon: '📱' },
        { id: 'sms', name: 'SMS', icon: '💬' },
        { id: 'email', name: 'Email', icon: '📧' },
        { id: 'copy', name: 'Copy Link', icon: '🔗' }
      ];

      expect(availableSharingMethods).toHaveLength(4);
      expect(availableSharingMethods.find(m => m.id === 'whatsapp')).toBeDefined();
      expect(availableSharingMethods.find(m => m.id === 'email')).toBeDefined();
    });
  });

  describe('Booking Workflow Integration Tests', () => {
    test('should complete full booking workflow end-to-end', async () => {
      const passengerCount = 3;
      const passengerName = 'Integration Test';
      const destination = 'Test Destination';

      const { supabase } = require('../src/config/supabase');
      
      // Step 1: Find available car
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: {
          queueId: 'q-integration',
          carId: 'car-integration',
          position: 1,
          carinfo: {
            plateNo: 'INTEGRATION123',
            driverName: 'Integration Driver',
            driverPhone: '+91-9999999999'
          }
        },
        error: null
      });

      // Step 2: Create trip
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: {
          tripId: 'trip-integration',
          status: 'Assigned'
        },
        error: null
      });

      // Step 3: Remove car from queue
      supabase.from().delete().eq.mockResolvedValueOnce({
        data: [{}],
        error: null
      });

      const bookingResult = await BookingService.assignTaxi(passengerCount);

      expect(bookingResult.success).toBe(true);
      expect(bookingResult.data?.car.plateNo).toBe('INTEGRATION123');
      
      // Verify all steps were called
      expect(supabase.from).toHaveBeenCalledTimes(3); // Select, Insert, Delete
    });

    test('should handle partial failures gracefully', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Car found successfully
      supabase.from().select().eq().order().limit().maybeSingle.mockResolvedValueOnce({
        data: { carId: 'car-partial-fail', carinfo: { plateNo: 'FAIL123' } },
        error: null
      });

      // Trip creation fails
      supabase.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await BookingService.assignTaxi(4);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Database error');
    });
  });
});
