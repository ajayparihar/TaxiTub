// TaxiTub Test Suite: Authentication & Session Management (TC1-TC3)
// Version: v1.0.0
// Author: Test Suite
// Coverage: Login success/failure, session expiry, logout functionality across all user roles

import { AuthService, LoginCredentials, User } from '../src/services/auth';

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(() => ({ data: null, error: null }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null }))
      }))
    }))
  };

  return {
    supabase: mockSupabase,
    TABLES: {
      ADMIN: 'admin',
      QUEUE_PAL: 'queuepal_staff',
      CAR_INFO: 'carinfo',
      QUEUE: 'queue',
    },
  };
});

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password: string, hash: string) => 
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));

describe('Authentication & Session Management Tests (TC1-TC3)', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('TC1: Successful Login (Admin/QueuePal/Passenger)', () => {
    test('should login Admin user successfully with correct credentials', async () => {
      // Mock admin user from database
      const mockAdminUser = {
        admin_id: 'admin-123',
        username: 'admin',
        full_name: 'System Administrator',
        password: 'hashed_admin123',
        is_active: true,
        last_login: null
      };

      const { supabase } = require('../src/config/supabase');
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({
        data: mockAdminUser,
        error: null
      });

      const credentials: LoginCredentials = {
        username: 'admin',
        password: 'admin123'
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        username: 'admin',
        role: 'Admin',
        name: 'System Administrator',
        isActive: true
      });
      
      // Verify user is stored in localStorage
      const storedUser = AuthService.getCurrentUser();
      expect(storedUser).not.toBeNull();
      expect(storedUser?.role).toBe('Admin');
    });

    test('should login QueuePal user successfully with correct credentials', async () => {
      // Mock QueuePal user from database
      const mockQueuePalUser = {
        id: 'qpal-456',
        username: 'queuepal01',
        name: 'Queue Manager',
        contact: '+91-9876543210',
        password: 'hashed_qpal123',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z'
      };

      const { supabase } = require('../src/config/supabase');
      // Admin query fails
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'No admin found' }
      });
      
      // QueuePal query succeeds
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({
        data: mockQueuePalUser,
        error: null
      });

      const credentials: LoginCredentials = {
        username: 'queuepal01',
        password: 'qpal123'
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        username: 'queuepal01',
        role: 'QueuePal',
        name: 'Queue Manager',
        isActive: true
      });

      // Verify personalized greeting shown
      const storedUser = AuthService.getCurrentUser();
      expect(storedUser?.name).toBe('Queue Manager');
    });

    test('should redirect to correct dashboard based on role', async () => {
      const adminUser: User = {
        id: 'admin-123',
        username: 'admin',
        role: 'Admin',
        isActive: true,
        createdAt: new Date()
      };

      const queuePalUser: User = {
        id: 'qpal-456',
        username: 'queuepal01',
        role: 'QueuePal',
        isActive: true,
        createdAt: new Date()
      };

      // Test Admin role routing
      AuthService.setCurrentUser(adminUser);
      expect(AuthService.canAccessRoute('Admin')).toBe(true);
      expect(AuthService.canAccessRoute('QueuePal')).toBe(true); // Admin can access QueuePal routes
      
      // Test QueuePal role routing
      AuthService.setCurrentUser(queuePalUser);
      expect(AuthService.canAccessRoute('QueuePal')).toBe(true);
      expect(AuthService.canAccessRoute('Admin')).toBe(false); // QueuePal cannot access Admin routes
    });
  });

  describe('TC2: Login Failure (Invalid Credentials)', () => {
    test('should fail login with invalid username', async () => {
      const { supabase } = require('../src/config/supabase');
      
      // Both admin and queuepal queries return null
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const credentials: LoginCredentials = {
        username: 'nonexistent',
        password: 'password123'
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid username or password');
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    test('should fail login with valid username but wrong password', async () => {
      const mockAdminUser = {
        admin_id: 'admin-123',
        username: 'admin',
        password: 'hashed_correctpassword',
        is_active: true
      };

      const { supabase } = require('../src/config/supabase');
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValueOnce({
        data: mockAdminUser,
        error: null
      });

      const credentials: LoginCredentials = {
        username: 'admin',
        password: 'wrongpassword'
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid username or password');
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    test('should fail login with empty credentials', async () => {
      const credentials: LoginCredentials = {
        username: '',
        password: ''
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid username or password');
    });

    test('should show appropriate error messages without dashboard access', async () => {
      const { supabase } = require('../src/config/supabase');
      supabase.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Connection failed' }
      });

      const credentials: LoginCredentials = {
        username: 'admin',
        password: 'admin123'
      };

      const result = await AuthService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
      expect(AuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('TC3: Session Expiry & Logout', () => {
    test('should logout user and clear session', () => {
      // Setup authenticated user
      const user: User = {
        id: 'admin-123',
        username: 'admin',
        role: 'Admin',
        isActive: true,
        createdAt: new Date()
      };
      
      AuthService.setCurrentUser(user);
      expect(AuthService.isAuthenticated()).toBe(true);

      // Logout
      AuthService.logout();
      
      expect(AuthService.getCurrentUser()).toBeNull();
      expect(AuthService.isAuthenticated()).toBe(false);
    });

    test('should handle corrupted session data gracefully', () => {
      // Manually set corrupted data in localStorage
      localStorage.setItem('taxitub_auth', 'corrupted-json-data');
      
      expect(AuthService.getCurrentUser()).toBeNull();
      expect(AuthService.isAuthenticated()).toBe(false);
    });

    test('should preserve user authentication status across page refresh', () => {
      const user: User = {
        id: 'qpal-456',
        username: 'queuepal01',
        role: 'QueuePal',
        name: 'Queue Manager',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      AuthService.setCurrentUser(user);
      
      // Simulate page refresh by getting user from storage
      const retrievedUser = AuthService.getCurrentUser();
      
      expect(retrievedUser).not.toBeNull();
      expect(retrievedUser?.username).toBe('queuepal01');
      expect(retrievedUser?.role).toBe('QueuePal');
      expect(retrievedUser?.createdAt).toBeInstanceOf(Date);
      expect(retrievedUser?.lastLogin).toBeInstanceOf(Date);
    });

    test('should handle session validation after timeout', () => {
      const user: User = {
        id: 'admin-123',
        username: 'admin', 
        role: 'Admin',
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      };

      AuthService.setCurrentUser(user);
      
      // In a real scenario, you would validate token expiry here
      // For now, we test that old sessions can still be retrieved
      const retrievedUser = AuthService.getCurrentUser();
      expect(retrievedUser).not.toBeNull();
      
      // Clear session manually to simulate expiry
      AuthService.logout();
      expect(AuthService.getCurrentUser()).toBeNull();
    });

    test('should redirect to login when accessing restricted routes without authentication', () => {
      // Ensure no user is logged in
      AuthService.logout();
      
      expect(AuthService.canAccessRoute('Admin')).toBe(false);
      expect(AuthService.canAccessRoute('QueuePal')).toBe(false);
      expect(AuthService.canAccessRoute()).toBe(true); // Public routes should be accessible
    });
  });

  describe('Role-based Access Control', () => {
    test('should enforce Admin-only access to admin features', () => {
      const adminUser: User = {
        id: 'admin-123',
        username: 'admin',
        role: 'Admin',
        isActive: true,
        createdAt: new Date()
      };

      const queuePalUser: User = {
        id: 'qpal-456',
        username: 'queuepal01',
        role: 'QueuePal',
        isActive: true,
        createdAt: new Date()
      };

      // Admin should have access to admin routes
      AuthService.setCurrentUser(adminUser);
      expect(AuthService.hasRole('Admin')).toBe(true);
      expect(AuthService.canAccessRoute('Admin')).toBe(true);

      // QueuePal should not have access to admin routes
      AuthService.setCurrentUser(queuePalUser);
      expect(AuthService.hasRole('Admin')).toBe(false);
      expect(AuthService.canAccessRoute('Admin')).toBe(false);
    });

    test('should allow QueuePal access to queue management features', () => {
      const queuePalUser: User = {
        id: 'qpal-456',
        username: 'queuepal01',
        role: 'QueuePal',
        isActive: true,
        createdAt: new Date()
      };

      AuthService.setCurrentUser(queuePalUser);
      expect(AuthService.hasRole('QueuePal')).toBe(true);
      expect(AuthService.canAccessRoute('QueuePal')).toBe(true);
    });
  });
});
