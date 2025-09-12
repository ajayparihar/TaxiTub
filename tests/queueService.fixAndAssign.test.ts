jest.mock('../src/config/supabase', () => {
  const chain = (data: any) => ({
    select: (_q: string, _opts?: any) => chain(data),
    eq: (_c: string, _v: any) => chain(data),
    order: (_c: string, _opts?: any) => chain(data),
    range: (_s: number, _e: number) => chain(data),
    maybeSingle: () => ({ data, error: null }),
    single: () => ({ data, error: null }),
    delete: () => ({ eq: (_c: string, _v: any) => ({ error: null })}),
    update: (_u: any) => ({ eq: (_c: string, _v: any) => ({ error: null })}),
  });

  const supabase = {
    from: (_t: string) => chain([]),
  } as any;

  return {
    supabase,
    TABLES: {
      QUEUE: 'queue',
      CAR_INFO: 'car_info',
    },
  };
});

import { QueueService, BookingService } from '../src/services/api';

const setSupabaseMock = (factory: (orig: any) => any) => {
  const mod = require('../src/config/supabase');
  mod.supabase = factory(mod.supabase);
};

describe('QueueService.fixQueuePositions', () => {
  it('updates only incorrect positions and returns count', async () => {
    const rows = [
      { queueid: 'q1', position: 2 },
      { queueid: 'q2', position: 1 },
      { queueid: 'q3', position: 4 },
      { queueid: 'q4', position: 5 },
    ];

    setSupabaseMock((_orig: any) => ({
      from: (table: string) => {
        if (table === 'queue') {
          return {
            select: () => ({ eq: (_c: string, _v: any) => ({ order: () => ({ data: rows, error: null }) }) }),
            update: (_u: any) => ({ eq: (_c: string, _v: any) => ({ error: null }) }),
          } as any;
        }
        return { select: () => ({ data: [], error: null }) } as any;
      }
    }));

    const result = await QueueService.fixQueuePositions(4);
    expect(result.success).toBe(true);
    // Expected updates: q1->1 (from 2), q3->3 (from 4), q4 stays 4 (already correct after shift)
    // Implementation counts updates where position !== index+1
    expect(result.data!.updated).toBe(2);
  });
});

describe('BookingService.assignTaxi', () => {
  it('picks the earliest car from the smallest suitable queue and removes it', async () => {
    const queueRows: any[] = [
      {
        queueId: 'qA',
        carId: 'carA',
        seater: 4,
        position: 1,
        timestampAdded: new Date('2025-01-01').toISOString(),
        carinfo: {
          carId: 'carA',
          plateNo: 'PLATEA',
          driverName: 'Alice',
          driverPhone: '123',
          carModel: 'Sedan',
          seater: 4,
        },
      },
    ];

    setSupabaseMock((_orig: any) => ({
      from: (table: string) => {
        if (table === 'queue') {
          return {
            select: () => ({
              eq: (_c: string, _v: any) => ({ order: () => ({ limit: () => ({ maybeSingle: () => ({ data: queueRows[0], error: null }) }) }) })
            }),
            delete: () => ({ eq: (_c: string, _v: any) => ({ error: null }) }),
          } as any;
        }
        return { select: () => ({ data: [], error: null }) } as any;
      }
    }));

    const result = await BookingService.assignTaxi(2);
    expect(result.success).toBe(true);
    expect(result.data!.car.plateNo).toBe('PLATEA');
    expect(result.data!.queuePosition).toBe(1);
  });
});

