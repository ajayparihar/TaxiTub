// TaxiTub Module: Authentication Service
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Initial authentication service for role-based access control

/**
 * SECURITY NOTE:
 * - Password hashing implemented with bcrypt for secure storage
 * - No plaintext passwords stored or transmitted
 * - localStorage is used for lightweight session state only; no secrets persisted
 * - Development fallbacks removed for production security
 */
import { supabase, TABLES } from "../config/supabase";
import { ApiResponse, ERROR_CODES } from "../types";
import { logger } from "../utils/logger";
import * as bcrypt from 'bcryptjs';

// Password hashing utility
const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// User types
/**
 * Authenticated user session shape for the frontend.
 * Note: This is a client-side representation and must NOT contain secrets or tokens.
 * - id: unique identifier (admin_id or queuepal.id)
 * - username: login username
 * - role: role for route authorization
 * - name/contact: optional display information
 * - isActive: account status (used to gate access)
 * - createdAt/lastLogin: timestamps for UX only
 */
export interface User {
  id: string;
  username: string;
  role: "Admin" | "QueuePal";
  name?: string;
  contact?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface QueuePalStaff {
  id: string;
  username: string;
  name: string;
  contact: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Auth state management
/**
 * Authentication and Authorization Service
 * Manages lightweight local sessions via localStorage and verifies QueuePal credentials via Supabase.
 * SECURITY: Admin hard-coded credentials are for development/demo only. Do NOT use in production.
 */
export class AuthService {
  // Admin credentials are now stored securely in the database with bcrypt hashing

  private static readonly AUTH_KEY = "taxitub_auth";
  
  // Login for Admin or QueuePal
  /**
   * Authenticate an Admin or QueuePal user.
   * - Admin: Validates against in-memory credentials (dev-only)
   * - QueuePal: Validates active staff record in Supabase and updates last_login
   * Persists session in localStorage upon success.
   * @param credentials - Username and password
   * @returns ApiResponse<User>
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    try {
      // Try direct admin table authentication (works with your current database schema)
      let adminAuthResult = null;
      try {
        // NOTE: Secure admin authentication with password hashing
        logger.log('🔍 Attempting admin authentication for:', credentials.username);
        const { data: adminResult, error: adminError } = await supabase
          .from(TABLES.ADMIN)
          .select('admin_id, username, full_name, last_login, is_active, password')
          .eq('username', credentials.username)
          .eq('is_active', true)
          .maybeSingle();
        
        // NOTE: Do not log secrets; passwordLength is logged for dev-only troubleshooting.
        // Remove these logs in production builds.
        logger.log('📊 Admin query result:', { 
          adminResult, 
          adminError,
          queryDetails: {
            table: TABLES.ADMIN,
            username: credentials.username,
            passwordLength: credentials.password.length
          }
        });

        // If admin found, verify password
        if (!adminError && adminResult) {
          // Verify password hash
          const passwordValid = await verifyPassword(credentials.password, adminResult.password);
          
          if (!passwordValid) {
            logger.log('❌ Admin password verification failed');
            adminAuthResult = { adminResult: null, adminError: { message: 'Invalid credentials' } };
          } else {
            // Update last_login timestamp
            await supabase
              .from(TABLES.ADMIN)
              .update({ 
                last_login: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('admin_id', adminResult.admin_id);

            const adminUser: User = {
              id: adminResult.admin_id,
              username: adminResult.username,
              role: "Admin",
              name: adminResult.full_name,
              isActive: true,
              createdAt: new Date(),
              lastLogin: adminResult.last_login ? new Date(adminResult.last_login) : new Date()
            };
            
            // Store in localStorage
            this.setCurrentUser(adminUser);
            
            logger.log('✅ Admin authentication successful via database table');
            return {
              success: true,
              data: adminUser
            };
          }
        }
        adminAuthResult = { adminResult, adminError };
      } catch (dbError) {
        logger.warn("Direct admin table authentication failed, trying fallback...", dbError);
        // Direct database query failed, try fallback admin authentication
        adminAuthResult = await this.fallbackAdminAuth(credentials);
        if (adminAuthResult.success) {
          return adminAuthResult;
        }
      }

      // If admin authentication failed, try QueuePal authentication
      let staff = null;
      let queuePalError = null;
      
      try {
        // NOTE: Secure QueuePal authentication with password hashing
        logger.log('🔍 Attempting QueuePal authentication for:', credentials.username);
        const result = await supabase
          .from(TABLES.QUEUE_PAL)
          .select("*")
          .eq("username", credentials.username)  // Using username field (matches your schema)
          .eq("is_active", true)  // Only active users
          .maybeSingle();  // Use maybeSingle to avoid 406 error
          
        logger.log('📊 QueuePal query result:', { data: result.data, error: result.error });
        staff = result.data;
        queuePalError = result.error;
      } catch (tableError) {
        logger.warn("QueuePal table query failed:", tableError);
        queuePalError = tableError;
      }

      if (queuePalError || !staff) {
        // Neither admin nor QueuePal authentication succeeded
        logger.warn("Authentication failed:", { 
          adminAuthResult, 
          queuePalError: (queuePalError as any)?.message || 'QueuePal table not found or empty'
        });
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Invalid username or password. Please check your credentials or ensure the database is properly set up."
        };
      }

      // Verify QueuePal password hash
      const queuePalPasswordValid = await verifyPassword(credentials.password, staff.password);
      if (!queuePalPasswordValid) {
        logger.log('❌ QueuePal password verification failed');
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Invalid username or password."
        };
      }

      // Update last login (if queuepal table has this field)
      // await supabase
      //   .from(TABLES.QUEUE_PAL)
      //   .update({ updated_at: new Date().toISOString() })
      //   .eq("queuepalid", staff.queuepalid);

      // Update last login timestamp
      await supabase
        .from(TABLES.QUEUE_PAL)
        .update({ updated_at: new Date().toISOString() })
        .eq("id", staff.id);

      const queuePalUser: User = {
        id: staff.id,
        username: staff.username,  // Using username field (matches your schema)
        role: "QueuePal",
        name: staff.name,
        contact: staff.contact,
        isActive: staff.is_active,
        createdAt: staff.created_at ? new Date(staff.created_at) : new Date(),
        lastLogin: new Date()
      };
      
      logger.log('✅ QueuePal authentication successful:', queuePalUser.username);

      // Store in localStorage
      this.setCurrentUser(queuePalUser);

      return {
        success: true,
        data: queuePalUser
      };

    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Login failed due to system error"
      };
    }
  }

  // Logout
  /**
   * Logs out the current user by clearing the in-memory session.
   * Note: Saved credentials (e.g., Remember Me) are intentionally preserved.
   */
  static logout(): void {
    localStorage.removeItem(this.AUTH_KEY);
    
    // Don't clear saved credentials on logout - only clear session
    // This allows Remember Me to persist across sessions
  }

  // Get current user
  /**
   * Retrieves the current authenticated user from localStorage.
   * Safely parses the stored JSON and rehydrates Date fields.
   * @returns User or null if not authenticated
   */
  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.AUTH_KEY);
      if (stored) {
        const user = JSON.parse(stored);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        if (user.lastLogin) user.lastLogin = new Date(user.lastLogin);
        return user;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Set current user
  /**
   * Persists the authenticated user in localStorage.
   * @param user - User session object
   */
  static setCurrentUser(user: User): void {
    localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
  }

  // Check if user is authenticated
  /**
   * Indicates whether a user session is currently active.
   */
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Check if user has role
  /**
   * Checks if the current user matches the required role.
   * @param role - Role name to check
   */
  static hasRole(role: "Admin" | "QueuePal"): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user can access route
  /**
   * Determines if the current user can access a route requiring a specific role.
   * Admin has full access; QueuePal has limited access.
   * @param requiredRole - Optional role requirement
   */
  static canAccessRoute(requiredRole?: "Admin" | "QueuePal"): boolean {
    if (!requiredRole) return true; // Public route (Passenger)
    
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admin can access everything
    if (user.role === "Admin") return true;
    
    // QueuePal can only access QueuePal routes
    if (user.role === "QueuePal" && requiredRole === "QueuePal") return true;
    
    return false;
  }

  /**
   * Fallback admin authentication - DISABLED for security
   * All authentication must go through the database
   * 
   * @param _credentials - Login credentials (unused, kept for compatibility)
   * @returns Promise resolving to authentication failure response
   */
  private static async fallbackAdminAuth(_credentials: LoginCredentials): Promise<ApiResponse<User>> {
    // Note: Parameter prefixed with underscore to indicate intentionally unused
    // This maintains the method signature while clearly indicating the parameter is not used
    
    logger.error("❌ Fallback admin authentication is disabled for security reasons");
    logger.error("ℹ️  Please ensure the admin table exists in your database");
    
    return {
      success: false,
      error_code: ERROR_CODES.DB_CONNECTION_ERROR,
      message: "Database authentication required. Please ensure the admin table is properly set up."
    };
  }
}

// QueuePal Staff Management Service
/**
 * Staff Management Service
 * Provides CRUD operations for QueuePal staff. SECURITY: Passwords are handled in plaintext in this MVP and should be hashed in production.
 */
export class StaffService {
  // Get all staff members
  /**
   * Retrieves all QueuePal staff records.
   * SECURITY: Returns plaintext password field from backend in this MVP; avoid exposing to UI in production.
   * @returns ApiResponse<QueuePalStaff[]>
   */
  static async getAllStaff(): Promise<ApiResponse<QueuePalStaff[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Handle specific case of missing table
        if (error.code === 'PGRST116' || error.message.includes('relation "queuepal_staff" does not exist')) {
          return {
            success: false,
            error_code: ERROR_CODES.DB_CONNECTION_ERROR,
            message: 'Staff table not found. Please run the database setup script first.'
          };
        }
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message
        };
      }

      const staff = (data || []).map(item => ({
        id: item.id,
        username: item.username,
        name: item.name,
        contact: item.contact,
        password: item.password,
        isActive: item.is_active,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
        createdBy: item.created_by
      }));

      return {
        success: true,
        data: staff
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch staff members"
      };
    }
  }

  // Add new staff member
  /**
   * Creates a new QueuePal staff account. Admin-only.
   * SECURITY: Password is stored/transported in plaintext in this MVP; replace with hashing (e.g., bcrypt) in production.
   */
  static async addStaff(staffData: {
    username: string;
    name: string;
    contact: string;
    password: string;
  }): Promise<ApiResponse<QueuePalStaff>> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "Admin") {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Only admin can add staff members"
        };
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(staffData.password);
      
      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .insert([{
          username: staffData.username,
          name: staffData.name,
          contact: staffData.contact,
          password: hashedPassword, // Now properly hashed!
          is_active: true,
          created_by: currentUser.id
        }])
        .select("*")
        .single();

      if (error) {
        // Check for duplicate username
        if (error.code === "23505") {
          return {
            success: false,
            error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
            message: "Username already exists"
          };
        }
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message
        };
      }

      const newStaff: QueuePalStaff = {
        id: data.id,
        username: data.username,
        name: data.name,
        contact: data.contact,
        password: data.password,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return {
        success: true,
        data: newStaff
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to add staff member"
      };
    }
  }

  // Update staff member
  /**
   * Updates QueuePal staff profile fields. Admin-only.
   * @param staffId - Target staff identifier
   * @param updates - Partial fields to update (name, contact, username)
   */
  static async updateStaff(
    staffId: string,
    updates: Partial<Pick<QueuePalStaff, "name" | "contact" | "username">>
  ): Promise<ApiResponse<QueuePalStaff>> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "Admin") {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Only admin can update staff members"
        };
      }

      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", staffId)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message
        };
      }

      const updatedStaff: QueuePalStaff = {
        id: data.id,
        username: data.username,
        name: data.name,
        contact: data.contact,
        password: data.password,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return {
        success: true,
        data: updatedStaff
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to update staff member"
      };
    }
  }

  // Suspend/Activate staff member
  /**
   * Toggles active/suspended status of a staff member. Admin-only.
   * @param staffId - Target staff identifier
   */
  static async toggleStaffStatus(staffId: string): Promise<ApiResponse<QueuePalStaff>> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "Admin") {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Only admin can modify staff status"
        };
      }

      // First get current status
      const { data: current, error: fetchError } = await supabase
        .from(TABLES.QUEUE_PAL)
        .select("is_active")
        .eq("id", staffId)
        .single();

      if (fetchError) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: "Staff member not found"
        };
      }

      // Toggle status
      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .update({
          is_active: !current.is_active,
          updated_at: new Date().toISOString()
        })
        .eq("id", staffId)
        .select("*")
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message
        };
      }

      const updatedStaff: QueuePalStaff = {
        id: data.id,
        username: data.username,
        name: data.name,
        contact: data.contact,
        password: data.password,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return {
        success: true,
        data: updatedStaff
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to update staff status"
      };
    }
  }

  // Reset staff password (generate a temporary password)
  /**
   * Resets a staff member's password to a new temporary value and returns it.
   * SECURITY: For MVP only. In production, use secure reset flows and hashing.
   */
  static async resetPassword(staffId: string): Promise<ApiResponse<{ newPassword: string }>> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "Admin") {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Only admin can reset staff passwords"
        };
      }

      const generateTempPassword = (length = 10) => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        let result = "";
        for (let i = 0; i < length; i++) {
          result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
      };

      const tmp = generateTempPassword(10);
      const hashedTempPassword = await hashPassword(tmp);
      
      const { error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .update({ password: hashedTempPassword, updated_at: new Date().toISOString() })
        .eq("id", staffId);

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data: { newPassword: tmp } };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to reset password",
      };
    }
  }

  // Delete staff member
  /**
   * Permanently deletes a staff account. Admin-only.
   * @param staffId - Target staff identifier
   */
  static async deleteStaff(staffId: string): Promise<ApiResponse<boolean>> {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser || currentUser.role !== "Admin") {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Only admin can delete staff members"
        };
      }

      const { error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .delete()
        .eq("id", staffId);

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message
        };
      }

      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to delete staff member"
      };
    }
  }
}
