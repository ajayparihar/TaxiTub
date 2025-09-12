jest.mock('../src/config/supabase', () => {
  // Basic chain builder
  const chain = (data: any) => ({
    select: (_q?: any, _opts?: any) => chain(data),
    eq: (_c: string, _v: any) => chain(data),
    order: (_c: string, _opts?: any) => chain(data),
    limit: (_n: number) => chain(data),
    maybeSingle: () => ({ data, error: null }),
    single: () => ({ data, error: null }),
    delete: () => ({ eq: (_c: string, _v: any) => ({ error: null }) }),
    update: (_u: any) => ({ eq: (_c: string, _v: any) => ({ error: null }) }),
    insert: (_rows: any[]) => ({ select: (_q?: any) => ({ single: () => ({ data: null, error: null }) }) }),
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

import { BookingService, QueueService } from '../src/services/api';

const setSupabase = (builder: (orig: any) => any) => {
  const mod = require('../src/config/supabase');
  mod.supabase = builder(mod.supabase);
};

describe('BookingService.assignTaxi (error paths)', () => {
  it('returns NO_AVAILABLE_CAR when there are no cars in any suitable queue', async () => {
    setSupabase((_orig: any) => ({
      from: (table: string) => {
        if (table === 'queue') {
          // All queues return empty
          return {
            select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }) }) })
          } as any;
        }
        return { select: () => ({ data: [], error: null }) } as any;
      }
    }));

    const res = await BookingService.assignTaxi(4);
    expect(res.success).toBe(false);
    expect(res.error_code).toBeDefined();
  });
});

describe('QueueService.addCarToQueue (concurrent retry)', () => {
  it('retries with incremented position if first insert hits a unique position error', async () => {
    // Mock car lookup to return seater
    const carId = 'car-1';
    let insertCalls = 0;

    setSupabase((_orig: any) => ({
      from: (table: string) => {
        if (table === 'car_info') {
          return {
            select: () => ({ eq: () => ({ single: () => ({ data: { carId, seater: 4 }, error: null }) }) })
          } as any;
        }
        if (table === 'queue') {
          return {
            // For max position read
            select: () => ({
              eq: () => ({ order: () => ({ limit: () => ({ maybeSingle: () => ({ data: { position: 5 }, error: null }) }) }) })
            }),
            // For insert
            insert: () => ({
              select: () => ({
                single: () => {
                  insertCalls++;
                  if (insertCalls === 1) {
                    // Simulate concurrent unique violation on position
                    return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "idx_position" on column position' } };
                  }
                  return { data: { queueId: 'q-new', carId, seater: 4, position: 7, timestampAdded: new Date().toISOString() }, error: null };
                }
              })
            })
          } as any;
        }
        return { select: () => ({ data: [], error: null }) } as any;
      }
    }));

    const res = await QueueService.addCarToQueue({ carId });
    expect(res.success).toBe(true);
    expect(insertCalls).toBeGreaterThanOrEqual(2);
  });
});

