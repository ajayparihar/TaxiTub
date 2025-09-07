// TaxiTub Module: Core Types
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Initial type definitions based on TaxiTub-3.MD schema

/**
 * Core entity types based on TaxiTub documentation
 * These interfaces define the primary data structures for the taxi queue management system
 */

/**
 * Car Information Entity
 * Represents a registered vehicle in the TaxiTub system
 * Maps directly to the 'carinfo' database table
 */
export interface CarInfo {
  carId: string;        // Unique identifier (UUID) for the vehicle
  plateNo: string;      // Vehicle registration plate number (unique)
  driverName: string;   // Name of the assigned driver
  driverPhone: string;  // Contact number for the driver
  carModel: string;     // Vehicle model/make information
  seater: number;       // Passenger capacity (typically 4, 6, 7, or 8)
  isActive?: boolean;   // Whether the car is active (eligible for queue/assignment)
}

/**
 * Queue Entity - FIFO queue management
 * Represents a car's position in a specific seater-type queue
 * Critical for maintaining First-In-First-Out queue integrity
 */
export interface Queue {
  queueId: string;      // Unique identifier for this queue entry
  carId: string;        // Foreign key reference to CarInfo.carId
  seater: number;       // Queue category (4-seater, 6-seater, etc.)
  position: number;     // FIFO position (1 = next to be assigned)
  timestampAdded: Date; // When the car joined the queue (for auditing)
}

/**
 * QueuePal Entity - Queue managers
 * Represents staff members authorized to manage taxi queues
 * Used for access control and audit trail purposes
 */
export interface QueuePal {
  queuePalId: string;   // Unique identifier for the queue manager
  name: string;         // Full name of the queue manager
  contact: string;      // Contact information (phone/email)
  assignedBy: string;   // AdminId who granted QueuePal permissions
}

/**
 * API Response Types
 * Standardized response format for all API operations
 * Provides consistent error handling and data structure across the application
 */
export interface ApiResponse<T> {
  success: boolean;     // Indicates if the operation completed successfully
  data?: T;            // Response payload (present on successful operations)
  error_code?: string; // Standardized error code for programmatic handling
  message?: string;    // Human-readable message for success/error feedback
}

/**
 * Queue Addition Request
 * Payload for adding a car to the queue system
 * Used by QueuePal users to submit cars for queue placement
 */
export interface QueueAddRequest {
  carId: string;        // ID of the car to add to the appropriate queue
}

/**
 * Queue View Types
 * Frontend-optimized representation of queue data
 * Combines queue position with essential car information for UI display
 */
export interface QueueView {
  seater: number;       // Queue category (passenger capacity)
  cars: Array<{         // Ordered list of cars in FIFO sequence
    carId: string;      // Unique car identifier
    plateNo: string;    // License plate for easy identification
    driverName: string; // Driver name for contact purposes
    carModel: string;   // Vehicle model for verification
    position: number;   // Current position in queue (1 = next)
    timestampAdded: Date; // When car joined queue (for wait time calculation)
  }>;
}

/**
 * User Role Types
 * Defines the three primary user types in the TaxiTub system
 * Used for access control and UI customization
 */
export type UserRole = "Admin" | "QueuePal" | "Passenger";

/**
 * Standardized Error Codes
 * Based on ERROR_HANDLING.MD specification
 * Enables consistent error handling and user feedback across the application
 * 
 * Each code maps to specific business logic errors:
 * - CAR_ALREADY_IN_QUEUE: Attempt to add car that's already queued
 * - CAR_NOT_FOUND: Reference to non-existent vehicle
 * - NO_AVAILABLE_CAR: No cars available for passenger count
 * - INVALID_SEATER_INPUT: Passenger count outside valid range
 * - DB_CONNECTION_ERROR: Database connectivity issues
 * - UNAUTHORIZED_ACCESS: Insufficient permissions for operation
 */
export const ERROR_CODES = {
  CAR_ALREADY_IN_QUEUE: "CAR_ALREADY_IN_QUEUE",   // Duplicate queue entry prevention
  CAR_NOT_FOUND: "CAR_NOT_FOUND",               // Vehicle not in system
  NO_AVAILABLE_CAR: "NO_AVAILABLE_CAR",         // No suitable cars in queue
  INVALID_SEATER_INPUT: "INVALID_SEATER_INPUT", // Invalid passenger count
  DB_CONNECTION_ERROR: "DB_CONNECTION_ERROR",   // Database operation failure
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",   // Permission denied
} as const;

/**
 * Type-safe error code union
 * Ensures only valid error codes can be used in error responses
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Database Record Metadata
 * Common timestamp fields for audit trail and data lifecycle management
 * Automatically managed by PostgreSQL triggers
 */
export type DatabaseRecord = {
  created_at?: string;  // ISO timestamp when record was created
  updated_at?: string;  // ISO timestamp when record was last modified
};

/**
 * Strict API Response Types
 * Discriminated union types for compile-time safety
 * Prevents accessing data on error responses and vice versa
 */
export interface SuccessResponse<T> {
  success: true;        // Literal true for successful operations
  data: T;             // Required data payload on success
  error_code?: never;  // Excluded from success responses
  message?: never;     // Excluded from success responses
}

export interface ErrorResponse {
  success: false;       // Literal false for failed operations
  data?: never;        // Excluded from error responses
  error_code: ErrorCode; // Required standardized error code
  message: string;     // Required human-readable error message
}

/**
 * Type-safe API response union
 * Compiler enforces checking success property before accessing data/error fields
 */
export type StrictApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Form State Management Types
 * Support for controlled form components with validation and user interaction tracking
 */
export interface FormFieldState {
  value: string | number;  // Current field value
  error?: string;          // Validation error message (if any)
  touched: boolean;        // Whether user has interacted with field
}

/**
 * Comprehensive form state for complex forms
 * Tracks individual field states plus overall form status
 * @template T - Shape of the form data object
 */
export interface FormState<T extends Record<string, any>> {
  fields: { [K in keyof T]: FormFieldState }; // State for each form field
  isValid: boolean;                           // Whether entire form passes validation
  isSubmitting: boolean;                      // Whether form submission is in progress
}

/**
 * Base Component Props
 * Common props shared across all reusable components
 * Provides consistent API for styling and testing
 */
export interface BaseComponentProps {
  className?: string;       // Additional CSS classes for styling
  "data-testid"?: string;  // Test identifier for automated testing
}

/**
 * Table Row Actions
 * Configurable action buttons for data table rows
 * Supports both synchronous and asynchronous operations
 * @template T - Type of the data item the action operates on
 */
export interface TableAction<T> {
  label: string;                                    // Button text
  icon?: React.ReactNode;                           // Optional icon component
  onClick: (item: T) => void | Promise<void>;       // Action handler (sync or async)
  disabled?: (item: T) => boolean;                  // Dynamic disable logic
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success"; // Button color theme
}

// Loading states
export type LoadingState = "idle" | "loading" | "success" | "error";

// Pagination
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Enhanced Car Info with validation state
export interface CarInfoFormData extends Omit<CarInfo, "carId"> {
  plateNo: string;
  driverName: string;
  driverPhone: string;
  carModel: string;
  seater: 4 | 6 | 7 | 8;
}

// Queue position with metadata
export interface QueuePosition {
  position: number;
  estimatedWaitTime?: number;
  isNext: boolean;
}


// System status
export interface SystemStatus {
  online: boolean;
  lastUpdated: Date;
  activeCars: number;
  queuedCars: number;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type AsyncEventHandler<T = void> = (event: React.SyntheticEvent) => Promise<T>;
export type FormSubmitHandler<T> = (data: T) => Promise<void> | void;

// API hook return types
export interface ApiHookResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface MutationHookResult<TData, TVariables = void> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}
