// TaxiTub Module: API Utilities and Helper Functions
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Comprehensive utility functions for API services with error handling and data mapping

/**
 * API Utilities Module
 * 
 * This module provides reusable utility functions, error handlers, and data mapping utilities
 * to reduce code duplication across API services and ensure consistent error handling patterns.
 * 
 * Features:
 * - Standardized error and success response creators
 * - Database error handling with PostgreSQL-specific error code mapping
 * - Column mapping utilities for database field transformation
 * - Validation functions for business logic
 * - Generic operation wrappers for consistent error handling
 * 
 * Architecture:
 * - Response Creators: Standardized API response format functions
 * - Error Handlers: Database-specific error processing
 * - Column Mappers: Frontend ↔ Database field transformation
 * - Validators: Business rule validation functions
 * - Operation Wrappers: Generic try-catch patterns for database operations
 * 
 * Usage:
 * Import specific utilities as needed in service classes to maintain
 * consistency and reduce code duplication across the application.
 */

import { ApiResponse, ERROR_CODES } from "../types";
import { 
  validateSeater as validateSeaterVR,
  validatePassengerCount as validatePassengerCountVR,
  validatePlateNumber as validatePlateVR,
  validatePhoneNumber as validatePhoneVR,
} from "../utils/validation";

// ========================================
// RESPONSE CREATORS
// ========================================

/**
 * Creates a standardized error response object
 * 
 * This function ensures all error responses across the API follow a consistent format.
 * It's used throughout the application to maintain uniform error handling patterns.
 * 
 * @param errorCode - Standardized error code from ERROR_CODES constant
 * @param message - Human-readable error message for user display
 * @returns ApiResponse with success: false and error details
 * 
 * @example
 * ```typescript
 * return createErrorResponse(
 *   ERROR_CODES.CAR_NOT_FOUND,
 *   "The requested vehicle could not be found in the system"
 * );
 * ```
 */
export function createErrorResponse(
  errorCode: typeof ERROR_CODES[keyof typeof ERROR_CODES], 
  message: string
): ApiResponse<never> {
  return {
    success: false,
    error_code: errorCode,
    message,
  };
}

/**
 * Creates a standardized success response object
 * 
 * This function ensures all successful API responses follow a consistent format.
 * It wraps the response data in a standardized envelope with success indicators.
 * 
 * @template T - Type of the response data
 * @param data - The successful operation result data
 * @returns ApiResponse with success: true and the data payload
 * 
 * @example
 * ```typescript
 * const car = await fetchCarFromDatabase(carId);
 * return createSuccessResponse(car);
 * ```
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

// ========================================
// ERROR HANDLING UTILITIES
// ========================================

/**
 * Database error handler with PostgreSQL-specific error code mapping
 * 
 * This function provides centralized database error handling with mapping
 * of PostgreSQL error codes to application-specific error responses.
 * It helps maintain consistent error messaging across all database operations.
 * 
 * PostgreSQL Error Codes:
 * - 23505: Unique constraint violation (duplicate records)
 * - 23503: Foreign key constraint violation
 * - 42P01: Undefined table (table does not exist)
 * - 42703: Undefined column (column does not exist)
 * 
 * @param error - The database error object from Supabase/PostgreSQL
 * @param customMessage - Optional custom error message to override default
 * @returns Standardized ApiResponse with appropriate error code and message
 * 
 * @example
 * ```typescript
 * try {
 *   await supabase.from('cars').insert(carData);
 * } catch (error) {
 *   return handleDatabaseError(error, "Failed to create new vehicle record");
 * }
 * ```
 */
export function handleDatabaseError(error: any, customMessage?: string): ApiResponse<never> {
  // PostgreSQL constraint violation mappings
  if (error.code === "23505") {
    // Unique constraint violation - typically duplicate plate numbers or IDs
    return createErrorResponse(
      ERROR_CODES.CAR_ALREADY_IN_QUEUE,
      "A record with this information already exists in the system"
    );
  }
  
  if (error.code === "23503") {
    // Foreign key constraint violation
    return createErrorResponse(
      ERROR_CODES.CAR_NOT_FOUND,
      "Referenced record not found - please check your data"
    );
  }
  
  if (error.code === "42P01") {
    // Table does not exist
    return createErrorResponse(
      ERROR_CODES.DB_CONNECTION_ERROR,
      "Database table not found - please check system configuration"
    );
  }
  
  if (error.code === "42703") {
    // Column does not exist
    return createErrorResponse(
      ERROR_CODES.DB_CONNECTION_ERROR,
      "Database column not found - please check system configuration"
    );
  }
  
  // Generic database error fallback
  return createErrorResponse(
    ERROR_CODES.DB_CONNECTION_ERROR,
    customMessage || error.message || "Database operation failed"
  );
}

/**
 * Generic try-catch wrapper for database operations
 * 
 * This higher-order function wraps database operations with standardized
 * error handling and response formatting. It reduces code duplication
 * and ensures consistent error handling patterns across all services.
 * 
 * @template T - Type of the expected successful operation result
 * @param operation - Async function that performs the database operation
 * @param customErrorMessage - Optional custom error message for failures
 * @returns Promise resolving to standardized ApiResponse
 * 
 * @example
 * ```typescript
 * return await executeDatabaseOperation(
 *   async () => {
 *     const { data, error } = await supabase
 *       .from('cars')
 *       .select('*')
 *       .eq('id', carId)
 *       .single();
 *     if (error) throw error;
 *     return data;
 *   },
 *   "Failed to fetch vehicle information"
 * );
 * ```
 */
export async function executeDatabaseOperation<T>(
  operation: () => Promise<T>,
  customErrorMessage?: string
): Promise<ApiResponse<T>> {
  try {
    const result = await operation();
    return createSuccessResponse(result);
  } catch (error) {
    return handleDatabaseError(error, customErrorMessage);
  }
}

// ========================================
// COLUMN MAPPING UTILITIES
// ========================================

/**
 * Car Information Column Mapping Utilities
 * 
 * Provides mapping between frontend camelCase field names and database snake_case
 * column names for the carinfo table. This ensures consistent data transformation
 * across all car-related database operations.
 * 
 * Database Schema:
 * - carid (UUID) → carId
 * - plateno (TEXT) → plateNo
 * - drivername (TEXT) → driverName
 * - driverphone (TEXT) → driverPhone
 * - carmodel (TEXT) → carModel
 * - seater (INTEGER) → seater (no change)
 */
export const CAR_INFO_COLUMNS = {
  /**
   * SELECT clause for retrieving car information with field name mapping
   * Maps database column names to frontend-friendly camelCase property names
   */
  SELECT: "carId:carid, plateNo:plateno, driverName:drivername, driverPhone:driverphone, carModel:carmodel, seater, isActive:is_active",
  
  /**
   * Transforms frontend car object to database insert format
   * @param car - Car object with frontend field names
   * @returns Database-formatted object for INSERT operations
   */
  INSERT_MAP: (car: any) => ({
    plateno: car.plateNo,
    drivername: car.driverName,
    driverphone: car.driverPhone,
    carmodel: car.carModel,
    seater: car.seater,
  }),
  
  /**
   * Transforms frontend update object to database update format
   * Only includes defined fields to support partial updates
   * @param updates - Partial car object with frontend field names
   * @returns Database-formatted object for UPDATE operations
   */
  UPDATE_MAP: (updates: any) => {
    const dbUpdates: any = {};
    if (updates.plateNo !== undefined) dbUpdates.plateno = updates.plateNo;
    if (updates.driverName !== undefined) dbUpdates.drivername = updates.driverName;
    if (updates.driverPhone !== undefined) dbUpdates.driverphone = updates.driverPhone;
    if (updates.carModel !== undefined) dbUpdates.carmodel = updates.carModel;
    if (updates.seater !== undefined) dbUpdates.seater = updates.seater;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    return dbUpdates;
  }
};

/**
 * Queue Column Mapping Utilities
 * 
 * Handles mapping for the queue table, which manages FIFO taxi queues.
 * Ensures consistent data transformation for queue-related operations.
 * 
 * Database Schema:
 * - queueid (UUID) → queueId
 * - carid (UUID) → carId
 * - seater (INTEGER) → seater (no change)
 * - position (INTEGER) → position (no change)
 * - timestampadded (TIMESTAMP) → timestampAdded
 */
export const QUEUE_COLUMNS = {
  /**
   * SELECT clause for retrieving queue information with field name mapping
   */
  SELECT: "queueId:queueid, carId:carid, seater, position, timestampAdded:timestampadded",
  
  /**
   * Transforms frontend queue object to database insert format
   * @param data - Queue object with frontend field names
   * @returns Database-formatted object for INSERT operations
   */
  INSERT_MAP: (data: any) => ({
    carid: data.carId,
    seater: data.seater,
    position: data.position,
    timestampadded: data.timestampAdded || new Date().toISOString(),
  })
};

/**
 * QueuePal Column Mapping Utilities
 * 
 * Handles mapping for the queuepal table, which manages queue staff accounts.
 * Supports both direct field mapping and update operations.
 * 
 * Database Schema:
 * - queuepalid (UUID) → queuePalId
 * - name (TEXT) → name (no change)
 * - contact (TEXT) → contact (no change)
 * - assignedby (TEXT) → assignedBy
 * - created_at (TIMESTAMP) → created_at (no change)
 * - updated_at (TIMESTAMP) → updated_at (no change)
 */
export const QUEUEPAL_COLUMNS = {
  /**
   * SELECT clause for retrieving QueuePal information with field name mapping
   */
  SELECT: "queuePalId:queuepalid, name, contact, assignedBy:assignedby, created_at, updated_at",
  
  /**
   * Transforms frontend update object to database update format
   * Only includes defined fields to support partial updates
   * @param updates - Partial QueuePal object with frontend field names
   * @returns Database-formatted object for UPDATE operations
   */
  UPDATE_MAP: (updates: any) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
    if (updates.assignedBy !== undefined) dbUpdates.assignedby = updates.assignedBy;
    return dbUpdates;
  }
};

// ========================================
// QUEUE VIEW MAPPING UTILITIES
// ========================================

import { QueueView } from "../types";

/**
 * Normalizes raw joined queue rows into a QueueView with consistent ordering and positions.
 * - Sorts by position, then timestamp defensively
 * - Renumbers positions from 1..n for UI consistency
 * @param rows - Raw rows from queue select with carinfo join
 * @param seater - The seater type for the view
 */
export function normalizeQueueRowsToView(rows: any[], seater: number): QueueView {
  const mapped = (rows || []).map((item: any) => ({
    carId: item.carId,
    plateNo: item.carinfo?.plateNo || "",
    driverName: item.carinfo?.driverName || "",
    carModel: item.carinfo?.carModel || "",
    position: item.position ?? 0,
    timestampAdded: new Date(item.timestampAdded),
  }));

  const cars = mapped
    .sort((a, b) => (a.position || 0) - (b.position || 0) || a.timestampAdded.getTime() - b.timestampAdded.getTime())
    .map((c, i) => ({ ...c, position: i + 1 }));

  return { seater, cars };
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Validates vehicle seater capacity
 * 
 * Ensures the seater count is within the supported range for the TaxiTub system.
 * The system supports 4-8 seater vehicles for airport taxi services.
 * 
 * @param seater - Number of seats in the vehicle
 * @returns true if seater count is valid, false otherwise
 * 
 * @example
 * ```typescript
 * if (!validateSeaterCount(car.seater)) {
 *   return createErrorResponse(
 *     ERROR_CODES.INVALID_SEATER_INPUT,
 *     "Vehicle must have between 4 and 8 seats"
 *   );
 * }
 * ```
 */
export function validateSeaterCount(seater: number): boolean {
  // Delegate to the richer validator and return boolean for backward compatibility
  return validateSeaterVR(seater).isValid;
}

/**
 * Validates passenger count for taxi booking
 * 
 * Ensures the passenger count is within reasonable limits for airport taxi service.
 * Maximum of 8 passengers is based on largest vehicle capacity minus driver.
 * 
 * @param count - Number of passengers requesting taxi service
 * @returns true if passenger count is valid, false otherwise
 * 
 * @example
 * ```typescript
 * if (!validatePassengerCount(booking.passengerCount)) {
 *   return createErrorResponse(
 *     ERROR_CODES.INVALID_SEATER_INPUT,
 *     "Passenger count must be between 1 and 8"
 *   );
 * }
 * ```
 */
export function validatePassengerCount(count: number): boolean {
  // Delegate to the richer validator and return boolean for backward compatibility
  return validatePassengerCountVR(count).isValid;
}

/**
 * Validates plate number format
 * 
 * Ensures plate number meets basic formatting requirements.
 * This is a basic validation - more sophisticated regional validation
 * could be added based on specific airport/country requirements.
 * 
 * @param plateNo - Vehicle license plate number
 * @returns true if plate number format is valid, false otherwise
 */
export function validatePlateNumber(plateNo: string): boolean {
  // Delegate to the centralized validator using shared constants
  return validatePlateVR(plateNo).isValid;
}

/**
 * Validates phone number format
 * 
 * Basic phone number validation for driver contact information.
 * Accepts various international formats and local formats.
 * 
 * @param phone - Phone number string
 * @returns true if phone number format appears valid, false otherwise
 */
export function validatePhoneNumber(phone: string): boolean {
  // Delegate to the centralized validator using shared constants
  return validatePhoneVR(phone).isValid;
}
