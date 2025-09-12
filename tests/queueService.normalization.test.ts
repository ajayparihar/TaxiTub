// Mock the Supabase client used inside the service
jest.mock('../src/config/supabase', () => {
  // Simple chainable mock for from().select().eq().order()
  const chain = (data: any) => ({
    select: (_q: string) => chain(data),
    eq: (_col: string, _val: any) => chain(data),
    order: (_col: string) => ({ data, error: null }),
  });

  const supabase = {
    from: (_table: string) => chain([]),
  } as any;

  return {
    supabase,
    TABLES: {
      QUEUE: 'queue',
      CAR_INFO: 'car_info',
      QUEUE_PAL_STAFF: 'queuepal_staff',
    },
  };
});

import { QueueService } from '../src/services/api';

// Override the supabase mock response for the specific call in getQueueBySeater
const setQueueMockData = (rows: any[]) => {
  const mod = require('../src/config/supabase');
  // Rebuild the mock chain to return our rows
  const chain = (data: any) => ({
    select: (_q: string) => chain(data),
    eq: (_col: string, _val: any) => chain(data),
    order: (_col: string) => ({ data, error: null }),
  });
  mod.supabase.from = (_table: string) => chain(rows);
};

describe('QueueService.getQueueBySeater normalization', () => {
  it('renumbers positions starting at 1 and sorts by position/timestamp', async () => {
    setQueueMockData([
      {
        carId: 'car-b',
        position: 2,
        timestampAdded: new Date('2025-01-02').toISOString(),
        carinfo: { plateNo: 'B', driverName: 'Driver B', carModel: 'Model B' },
      },
      {
        carId: 'car-c',
        position: 5,
        timestampAdded: new Date('2025-01-03').toISOString(),
        carinfo: { plateNo: 'C', driverName: 'Driver C', carModel: 'Model C' },
      },
      {
        carId: 'car-a',
        position: 1,
        timestampAdded: new Date('2025-01-01').toISOString(),
        carinfo: { plateNo: 'A', driverName: 'Driver A', carModel: 'Model A' },
      },
    ]);

    const result = await QueueService.getQueueBySeater(4);
    expect(result.success).toBe(true);
    const cars = result.data!.cars;

    // Should be renumbered 1..N
    expect(cars.map(c => c.position)).toEqual([1, 2, 3]);
    // Should be sorted by original position (1,2,5)
    expect(cars.map(c => c.carId)).toEqual(['car-a', 'car-b', 'car-c']);
  });
});

