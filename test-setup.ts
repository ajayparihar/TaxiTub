// Test Setup for Vitest
// This file runs before all tests

import { vi } from 'vitest';

// Mock environment variables
vi.mock('./src/config/supabase', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              single: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  };

  return {
    supabase: mockSupabase,
    TABLES: {
      CAR_INFO: 'carinfo',
      QUEUE_4SEATER: 'queue_4seater',
      QUEUE_5SEATER: 'queue_5seater',
      QUEUE_6SEATER: 'queue_6seater',
      QUEUE_7SEATER: 'queue_7seater',
      QUEUE_8SEATER: 'queue_8seater',
      QUEUE_PAL: 'queuepal',
      ADMIN: 'admin'
    },
    SEATER_QUEUE_TABLES: {
      4: 'queue_4seater',
      5: 'queue_5seater',
      6: 'queue_6seater',
      7: 'queue_7seater',
      8: 'queue_8seater'
    }
  };
});

// Setup global test environment
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};
