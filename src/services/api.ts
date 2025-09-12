// TaxiTub Module: Core API Service
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Initial API service implementation based on TaxiTub-3.MD flows

import { supabase, TABLES, SEATER_QUEUE_TABLES } from "../config/supabase";
import {
  CarInfo,
  Queue,
  QueuePal,
  QueueAddRequest,
  ApiResponse,
  QueueView,
  ERROR_CODES,
} from "../types";
import { CAR_INFO_COLUMNS, normalizeQueueRowsToView } from "./apiUtils";
import { SEATER_TYPES } from "../constants";
import { logger } from "../utils/logger";

// =============================================================================
// CONSTANTS AND VALIDATION RULES
// =============================================================================

/**
 * System validation constants for input validation and business rules
 * These constants ensure consistency across the application and make
 * business rules easily configurable.
 */
const VALIDATION_RULES = {
  /** Passenger count limits for taxi assignment */
  PASSENGER_COUNT: {
    MIN: 1,
    MAX: 8,
  },
  /** Pagination limits for performance optimization */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 100,
    MIN_PAGE: 1,
  },
  /** Seater capacity validation */
  SEATER_CAPACITY: {
    VALID_TYPES: [4, 5, 6, 7, 8] as const,
    MIN: 4,
    MAX: 8,
  },
  /** Database operation limits */
  DATABASE: {
    MAX_RETRY_ATTEMPTS: 3,
    QUERY_TIMEOUT_MS: 30000,
  },
} as const;

/**
 * Input validation helper functions
 * These functions provide consistent validation across all services
 * and ensure data integrity before database operations.
 */
const ValidationHelpers = {
  /**
   * Validates passenger count for taxi assignment
   * @param count - Number of passengers
   * @returns True if valid, false otherwise
   */
  isValidPassengerCount: (count: number): boolean => {
    return Number.isInteger(count) && 
           count >= VALIDATION_RULES.PASSENGER_COUNT.MIN && 
           count <= VALIDATION_RULES.PASSENGER_COUNT.MAX;
  },
  
  /**
   * Validates seater capacity
   * @param seater - Vehicle seater capacity
   * @returns True if valid, false otherwise
   */
  isValidSeaterType: (seater: number): boolean => {
    return VALIDATION_RULES.SEATER_CAPACITY.VALID_TYPES.includes(seater as any);
  },
  
  /**
   * Validates pagination parameters
   * @param page - Page number
   * @param pageSize - Number of items per page
   * @returns Object with validation results
   */
  validatePagination: (page: number, pageSize: number): {
    isValid: boolean;
    normalizedPage: number;
    normalizedPageSize: number;
    error?: string;
  } => {
    // Normalize and validate page number
    const normalizedPage = Math.max(VALIDATION_RULES.PAGINATION.MIN_PAGE, Math.floor(page) || 1);
    
    // Normalize and validate page size
    const normalizedPageSize = Math.min(
      VALIDATION_RULES.PAGINATION.MAX_PAGE_SIZE,
      Math.max(1, Math.floor(pageSize) || VALIDATION_RULES.PAGINATION.DEFAULT_PAGE_SIZE)
    );
    
    return {
      isValid: true,
      normalizedPage,
      normalizedPageSize,
    };
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility function to create standardized error responses
 * This eliminates redundant error handling patterns across the codebase
 * and ensures consistent error response structure.
 * 
 * @param {string} errorCode - Error code from ERROR_CODES enum
 * @param {string} defaultMessage - Default message to use if none provided
 * @param {Error|string} [originalError] - Original error object or message (optional)
 * @returns {ApiResponse<never>} Standardized error response object
 */
const createErrorResponse = (
  errorCode: string,
  defaultMessage: string,
  originalError?: Error | string
): ApiResponse<never> => {
  const errorMessage = typeof originalError === 'string'
    ? originalError
    : originalError?.message || defaultMessage;
    
  return {
    success: false,
    error_code: errorCode,
    message: errorMessage,
  };
};

/**
 * Utility function to validate and resolve queue table name
 * Eliminates duplicate seater validation logic across queue operations
 * 
 * @param {number} seater - Seater capacity to validate
 * @returns {string|null} Table name if valid, null if invalid
 */
const getValidatedQueueTable = (seater: number): string | null => {
  const tableName = SEATER_QUEUE_TABLES[seater];
  return tableName || null;
};

/**
 * Utility function to create success response with consistent structure
 * Reduces boilerplate code for successful API responses
 * 
 * @template T
 * @param {T} data - Response data of type T
 * @returns {ApiResponse<T>} Standardized success response
 */
const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

/**
 * Car Management Service - Handles all car-related database operations for the TaxiTub fleet
 * 
 * This service provides comprehensive CRUD operations for vehicle management with:
 * - Pagination support for large datasets
 * - Search functionality across multiple fields (plate, driver, model)
 * - Fallback mechanisms for different database schema versions
 * - Active/inactive status management for operational control
 * 
 * **Security Considerations:**
 * - All operations require appropriate role-based access
 * - Database queries use prepared statements via Supabase
 * - Input validation and sanitization handled at database layer
 * 
 * **Performance Features:**
 * - Server-side pagination reduces memory usage
 * - Optimized queries with proper column selection
 * - Fallback methods for backward compatibility
 * 
 * @example
 * ```typescript
 * // Get paginated cars with search
 * const result = await CarService.getCars(1, 20, "toyota");
 * if (result.success) {
 *   console.log(`Found ${result.data.total} cars`);
 * }
 * 
 * // Add new car to fleet
 * const newCar = await CarService.addCar({
 *   plateNo: "DL01AB1234",
 *   driverName: "John Doe",
 *   driverPhone: "+91-9876543210",
 *   carModel: "Toyota Innova",
 *   seater: 6
 * });
 * ```
 * 
 * @version 0.1.0
 * @since 2025-09-06
 */
export class CarService {
  /**
   * Retrieves cars with advanced pagination and multi-field search capabilities
   * 
   * **Search Strategy:**
   * - Uses case-insensitive search across plateNo, driverName, and carModel fields
   * - Server-side filtering with PostgreSQL ILIKE for performance
   * - Falls back to client-side filtering for complex search scenarios
   * 
   * **Pagination Logic:**
   * - 1-indexed page numbers for user-friendly interface
   * - Automatic calculation of hasMore flag for infinite scroll support
   * - Efficient offset-based pagination with count optimization
   * 
   * **Performance Optimizations:**
   * - Uses exact count only when needed to reduce query overhead
   * - Optimized column selection to minimize data transfer
   * - Smart query path selection based on search requirements
   * 
   * @param {number} [page=1] - Page number (1-indexed) for pagination. Must be >= 1
   * @param {number} [pageSize=50] - Number of cars per page. Range: 1-100 for optimal performance
   * @param {string} [searchTerm=""] - Search string to filter by plate/driver/model (case-insensitive)
   * 
   * @returns {Promise<ApiResponse<{cars: CarInfo[]; hasMore: boolean; total: number}>>} 
   *   Paginated response with:
   *   - cars: Array of car records matching search criteria
   *   - hasMore: Boolean indicating if more pages exist
   *   - total: Total count of matching records
   * 
   * @throws {ERROR_CODES.DB_CONNECTION_ERROR} Database connection or query failure
   * 
   * @example
   * ```typescript
   * // Get first page with default settings
   * const result = await CarService.getCars();
   * 
   * // Search with pagination
   * const searchResult = await CarService.getCars(1, 20, "innova");
   * if (searchResult.success) {
   *   const { cars, hasMore, total } = searchResult.data;
   *   console.log(`Found ${total} cars, showing ${cars.length}`);
   *   if (hasMore) console.log("More results available");
   * }
   * ```
   */
  static async getCars(
    page: number = 1,
    pageSize: number = 50,
    searchTerm: string = ""
  ): Promise<ApiResponse<{ cars: CarInfo[]; hasMore: boolean; total: number }>> {
    try {
      // Validate and normalize pagination parameters
      const paginationValidation = ValidationHelpers.validatePagination(page, pageSize);
      const normalizedPage = paginationValidation.normalizedPage;
      const normalizedPageSize = paginationValidation.normalizedPageSize;
      
      // Calculate offset for pagination (zero-indexed for database queries)
      const offset = (normalizedPage - 1) * normalizedPageSize;
      
      // Handle search queries with client-side filtering
      // Note: Using client-side filtering to avoid PostgREST URL encoding complexities
      // TODO: Consider server-side filtering for better performance with large datasets
      if (searchTerm && searchTerm.trim()) {
        // Server-side case-insensitive search across multiple fields using OR
        const term = `%${searchTerm.trim()}%`;
        const { data, error, count } = await supabase
          .from(TABLES.CAR_INFO)
          .select(CAR_INFO_COLUMNS.SELECT, { count: "exact" })
          .or(`plateno.ilike.${term},drivername.ilike.${term},carmodel.ilike.${term}`)
          .order("plateno")
          .range(offset, offset + normalizedPageSize - 1);

        if (error) {
          return createErrorResponse(
            ERROR_CODES.DB_CONNECTION_ERROR,
            "Failed to fetch cars",
            error
          );
        }

        const hasMore = count ? offset + normalizedPageSize < count : false;
        return {
          success: true,
          data: {
            cars: (data || []) as unknown as CarInfo[],
            hasMore,
            total: count || 0,
          },
        };
      }
      
      // Optimized path: Use server-side pagination when no search is needed
      const res = await CarService.selectCarsWithFallback({
        withCount: true,
        range: { from: offset, to: offset + normalizedPageSize - 1 },
      });

      if (res.error) {
        return createErrorResponse(
          ERROR_CODES.DB_CONNECTION_ERROR,
          "Failed to fetch cars",
          res.error
        );
      }

      const rows = res.rows || [];
      const totalCount = res.count || 0;

      // Determine if there are more pages available
      const hasMore = totalCount ? offset + normalizedPageSize < totalCount : false;
      
      return { 
        success: true, 
        data: {
          cars: (rows as unknown as CarInfo[]),
          hasMore,
          total: totalCount
        }
      };
    } catch (error) {
      return createErrorResponse(
        ERROR_CODES.DB_CONNECTION_ERROR,
        "Failed to fetch cars",
        error as Error
      );
    }
  }

  /**
   * Detect whether the carinfo table supports is_active column
   */
  static async supportsCarStatus(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .select("is_active")
        .limit(1);
      if (error) return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Internal helper to select cars with fallback mapping for missing is_active column.
   * Returns normalized rows and optional count; on failure, returns { error }.
   */
  private static async selectCarsWithFallback(opts: {
    withCount?: boolean;
    range?: { from: number; to: number };
  }): Promise<{ rows: any[]; count?: number; error?: any }> {
    const withCount = !!opts.withCount;
    try {
      let query = supabase
        .from(TABLES.CAR_INFO)
        .select(CAR_INFO_COLUMNS.SELECT, withCount ? { count: "exact" } as any : undefined)
        .order("plateno");

      if (opts.range) {
        query = (query as any).range(opts.range.from, opts.range.to);
      }

      const { data, error, count } = await (query as any);
      if (!error) {
        return { rows: (data || []), count: count || undefined };
      }

      // Fallback if is_active does not exist
      let fbQuery = supabase
        .from(TABLES.CAR_INFO)
        .select(
          "carId:carid, plateNo:plateno, driverName:drivername, driverPhone:driverphone, carModel:carmodel, seater",
          withCount ? { count: "exact" } as any : undefined
        )
        .order("plateno");

      if (opts.range) {
        fbQuery = (fbQuery as any).range(opts.range.from, opts.range.to);
      }

      const fallback = await (fbQuery as any);
      if (fallback.error) {
        return { rows: [], error: fallback.error };
      }

      const rows = (fallback.data || []).map((c: any) => ({ ...c, isActive: true }));
      return { rows, count: fallback.count || undefined };
    } catch (err) {
      return { rows: [], error: err };
    }
  }

  /**
   * Optimized method: Retrieves all cars for display with virtual scrolling
   * Used for dynamic loading with client-side filtering and search
   * @returns Promise resolving to all car records
   */
  static async getAllCarsForDisplay(): Promise<ApiResponse<CarInfo[]>> {
    try {
      const res = await CarService.selectCarsWithFallback({ withCount: false });
      if (res.error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: res.error.message,
        };
      }
      return { success: true, data: (res.rows || []) as unknown as CarInfo[] };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch cars for display",
      };
    }
  }

  /**
   * Legacy method: Retrieves all cars without pagination
   * @deprecated Use getCars() method instead for better performance with large datasets
   * @returns Promise resolving to all car records
   */
  static async getAllCars(): Promise<ApiResponse<CarInfo[]>> {
    // DEPRECATION NOTE: Prefer getAllCarsForDisplay() for large datasets.
    // This method delegates to the optimized variant to avoid duplication
    // while preserving error messaging semantics for the legacy API.
    try {
      const result = await CarService.getAllCarsForDisplay();
      if (!result.success) {
        // Preserve legacy error message for this method when a generic failure occurs
        const legacyMessage = result.message === "Failed to fetch cars for display"
          ? "Failed to fetch cars"
          : (result.message || "Failed to fetch cars");
        return createErrorResponse(
          result.error_code || ERROR_CODES.DB_CONNECTION_ERROR,
          legacyMessage
        );
      }
      return result;
    } catch (error) {
      return createErrorResponse(
        ERROR_CODES.DB_CONNECTION_ERROR,
        "Failed to fetch cars",
        error as Error
      );
    }
  }

  /**
   * Adds a new car to the system
   * @param car - Car information (carId is auto-generated)
   * @returns Promise resolving to the created car record with generated carId
   */
  static async addCar(
    car: Omit<CarInfo, "carId">,
  ): Promise<ApiResponse<CarInfo>> {
    try {
      // Transform frontend field names to database column names
      const dbCar = CAR_INFO_COLUMNS.INSERT_MAP(car);

      const { data, error } = await supabase
        .from(TABLES.CAR_INFO)
        .insert([dbCar])
        .select(CAR_INFO_COLUMNS.SELECT)
        .single();

      if (error) {
        // Handle PostgreSQL unique constraint violation (duplicate plate number)
        if (error.code === "23505") {
          return {
            success: false,
            error_code: ERROR_CODES.CAR_ALREADY_IN_QUEUE,
            message: "Car with this plate number already exists",
          };
        }
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data: (data as unknown as CarInfo) };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to add car",
      };
    }
  }

  /**
   * Updates car information
   * @param carId - Unique identifier for the car to update
   * @param updates - Partial car information with fields to update
   * @returns Promise resolving to the updated car record
   */
  static async updateCar(
    carId: string,
    updates: Partial<CarInfo>,
  ): Promise<ApiResponse<CarInfo>> {
    try {
      // Build update object with database column names, only including defined fields
      const dbUpdates = CAR_INFO_COLUMNS.UPDATE_MAP(updates as any);

      const { data, error } = await supabase
        .from(TABLES.CAR_INFO)
        .update(dbUpdates)
        .eq("carid", carId)
        .select(CAR_INFO_COLUMNS.SELECT)
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.CAR_NOT_FOUND,
          message: error.message,
        };
      }

      return { success: true, data: (data as unknown as CarInfo) };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to update car",
      };
    }
  }

  /**
   * Toggle car active status (suspend/activate)
   */
  static async toggleCarStatus(carId: string): Promise<ApiResponse<{ isActive: boolean }>> {
    try {
      const { data: current, error: fetchError } = await supabase
        .from(TABLES.CAR_INFO)
        .select("is_active")
        .eq("carid", carId)
        .single();
      if (fetchError) {
        return {
          success: false,
          error_code: ERROR_CODES.CAR_NOT_FOUND,
          message: fetchError.message,
        };
      }
      const next = !current.is_active;
      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .update({ is_active: next, updated_at: new Date().toISOString() })
        .eq("carid", carId);
      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }
      return { success: true, data: { isActive: next } };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to toggle car status",
      };
    }
  }

  /**
   * Removes a car from the system
   * @param carId - Unique identifier for the car to delete
   * @returns Promise resolving to boolean indicating success
   */
  static async deleteCar(carId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.CAR_INFO)
        .delete()
        .eq("carid", carId);

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.CAR_NOT_FOUND,
          message: error.message,
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to delete car",
      };
    }
  }
}

/**
 * Queue Management Service - Advanced FIFO queue operations for TaxiTub taxi dispatch
 * 
 * This service implements a sophisticated queue management system with:
 * - **Individual Seater Queues**: Separate database tables for each vehicle capacity (4,5,6,7,8 seaters)
 * - **FIFO Integrity**: Maintains strict First-In-First-Out order with position validation
 * - **Concurrent Safety**: Handles multiple simultaneous queue operations safely
 * - **Auto-Repair**: Automatic position fixing to maintain consecutive numbering
 * 
 * **Queue Architecture:**
 * ```
 * queue_4seater  →  [Car1, Car2, Car3] (positions: 1,2,3)
 * queue_5seater  →  [Car4, Car5]       (positions: 1,2)
 * queue_6seater  →  [Car6]             (positions: 1)
 * queue_7seater  →  []                 (empty)
 * queue_8seater  →  [Car7, Car8]       (positions: 1,2)
 * ```
 * 
 * **Key Benefits:**
 * - **Isolation**: Each seater type has independent queue operations
 * - **Performance**: Table-specific indexes for faster queries
 * - **Scalability**: No cross-table dependencies or locks
 * - **Reliability**: Built-in position repair mechanisms
 * 
 * **Security Features:**
 * - Validates car registration before queuing
 * - Prevents duplicate queue entries
 * - Checks car active status to prevent suspended vehicles
 * - Maintains audit trail with timestamps
 * 
 * @example
 * ```typescript
 * // Add car to appropriate queue based on seater capacity
 * const queueResult = await QueueService.addCarToQueue({ carId: "car-123" });
 * 
 * // Get current 6-seater queue status
 * const queue = await QueueService.getQueueBySeater(6);
 * if (queue.success) {
 *   console.log(`${queue.data.entries.length} cars in 6-seater queue`);
 * }
 * 
 * // Fix position gaps after manual operations
 * await QueueService.fixQueuePositions(); // All queues
 * await QueueService.fixQueuePositions(4); // Only 4-seater queue
 * ```
 * 
 * @version 0.1.0
 * @since 2025-09-06
 * @see {@link BookingService} For taxi assignment and queue consumption
 */
export class QueueService {
  /**
   * Renumber positions for a specific seater queue to be consecutive starting at 1.
   * Returns the number of updated records. Logs errors but continues processing.
   *
   * @param seaterType - Seater capacity (e.g., 4,5,6,7,8) determining the queue table
   * @returns Number of queue entries whose positions were adjusted to restore FIFO integrity
   */
  private static async renumberQueueForSeater(seaterType: number): Promise<number> {
    let updated = 0;
    const tableName = SEATER_QUEUE_TABLES[seaterType];
    
    if (!tableName) {
      logger.error(`Invalid seater type: ${seaterType}`);
      return 0;
    }
    
    const { data: queueData, error: fetchError } = await supabase
      .from(tableName)
      .select("queueid, position")
      .order("position");

    if (fetchError) {
      logger.error(`Error fetching ${seaterType}-seater queue:`, fetchError);
      return 0;
    }

    if (!queueData || queueData.length === 0) return 0;

    const needsFixing = queueData.some((item, index) => item.position !== index + 1);
    if (!needsFixing) return 0;

    logger.log(`🔧 Fixing ${seaterType}-seater queue positions...`);

    for (let i = 0; i < queueData.length; i++) {
      const correctPosition = i + 1;
      const currentItem = queueData[i];
      if (currentItem && currentItem.position !== correctPosition) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ position: correctPosition })
          .eq("queueid", currentItem?.queueid);
        if (updateError) {
          logger.error(`Error updating position for queue ${currentItem?.queueid}:`, updateError);
        } else {
          updated++;
        }
      }
    }

    return updated;
  }

  /**
   * Resolve the queue table name for a given seater or return a standardized error response.
   * This preserves existing INVALID_SEATER_INPUT behavior and message text.
   */
  private static getTableNameOrError(
    seater: number
  ): { ok: true; tableName: string } | { ok: false; response: ApiResponse<never> } {
    const tableName = getValidatedQueueTable(seater);
    if (!tableName) {
      return {
        ok: false,
        response: createErrorResponse(
          ERROR_CODES.INVALID_SEATER_INPUT,
          `Invalid seater type: ${seater}`
        ),
      };
    }
    return { ok: true, tableName };
  }

  /**
   * Fetches minimal car data needed for queue operations (carId, seater, is_active if present).
   * Falls back when is_active column is absent, matching legacy behavior exactly.
   */
  private static async fetchCarDataForQueue(
    carId: string
  ): Promise<{ ok: true; carData: any } | { ok: false; response: ApiResponse<never> }> {
    const carRes = await supabase
      .from(TABLES.CAR_INFO)
      .select("carId:carid, seater, is_active")
      .eq("carid", carId)
      .single();

    let carData: any = carRes.data;
    const carError = carRes.error;

    if (carError) {
      // Fallback without is_active column
      const fb = await supabase
        .from(TABLES.CAR_INFO)
        .select("carId:carid, seater")
        .eq("carid", carId)
        .single();
      if (fb.error || !fb.data) {
        return {
          ok: false,
          response: createErrorResponse(
            ERROR_CODES.CAR_NOT_FOUND,
            "Car not registered in system",
            fb.error
          ),
        };
      }
      carData = fb.data;
      (carData as any).is_active = true; // assume active if column absent
    }

    return { ok: true, carData };
  }

  /**
   * Checks if a car already exists in the specific seater queue table.
   * Preserves DB error handling message text.
   */
  private static async isCarAlreadyQueued(
    tableName: string,
    carId: string
  ): Promise<{ ok: true; exists: boolean } | { ok: false; response: ApiResponse<never> }> {
    const { data: existingQueue, error: queueCheckError } = await supabase
      .from(tableName)
      .select("queueId:queueid")
      .eq("carid", carId)
      .maybeSingle();

    if (queueCheckError) {
      return {
        ok: false,
        response: {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: `Failed to check queue status: ${queueCheckError.message}`,
        },
      };
    }

    return { ok: true, exists: !!existingQueue };
  }

  /**
   * Determines the next FIFO position for the given table with the same retry/fallback semantics.
   */
  private static async determineNextPosition(tableName: string): Promise<number> {
    let nextPosition = 1;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { data: maxPositionData, error: positionError } = await supabase
          .from(tableName)
          .select("position")
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (positionError && positionError.code !== 'PGRST116') {
          // PGRST116 is PostgREST "no rows found" error - expected for empty queues
          throw positionError;
        }

        nextPosition = maxPositionData ? (maxPositionData as any).position + 1 : 1;
        break;
      } catch (_err) {
        // Fallback for empty queues or unexpected errors
        nextPosition = 1;
        break;
      }
    }

    return nextPosition;
  }

  /**
   * Inserts a queue entry with up to 3 retries, incrementing position on unique constraint collisions.
   * Preserves original error messaging.
   */
  private static async insertQueueEntryWithRetries(
    tableName: string,
    carId: string,
    basePosition: number
  ): Promise<{ ok: true; data: any } | { ok: false; response: ApiResponse<never> }> {
    let insertAttempts = 0;

    while (insertAttempts < 3) {
      const { data: insertData, error } = await supabase
        .from(tableName)
        .insert([
          {
            carid: carId,
            position: basePosition + insertAttempts, // same collision handling
            timestampadded: new Date().toISOString(),
          },
        ])
        .select(
          "queueId:queueid, carId:carid, position, timestampAdded:timestampadded",
        )
        .single();

      if (!error) {
        return { ok: true, data: insertData };
      }

      // Handle PostgreSQL unique constraint violation on position (concurrent inserts)
      if (error.code === "23505" && error.message.includes("position")) {
        insertAttempts++;
        continue; // Retry with incremented position
      }

      // For non-position related errors, fail immediately
      return {
        ok: false,
        response: {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        },
      };
    }

    return {
      ok: false,
      response: {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to add car to queue after multiple attempts",
      },
    };
  }

  /**
   * Adds a car to the appropriate queue based on its seater capacity
   * Implements FIFO (First In, First Out) queue logic
   * @param request - Contains the carId to add to queue
   * @returns Promise resolving to the created queue entry
   */
  static async addCarToQueue(
    request: QueueAddRequest,
  ): Promise<ApiResponse<Queue>> {
    try {
      // Validate car exists and retrieve seater information
      const carResult = await this.fetchCarDataForQueue(request.carId);
      if (!carResult.ok) {
        return carResult.response;
      }
      const carData = carResult.carData;

      // Prevent adding suspended cars
      if (carData && carData.is_active === false) {
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Car is suspended and cannot be queued",
        };
      }

      // Resolve table name for the car's seater
      const tn = this.getTableNameOrError(carData.seater);
      if (!tn.ok) {
        return tn.response;
      }
      const tableName = tn.tableName;

      // Prevent duplicate queue entries - check if car is already queued
      const existsRes = await this.isCarAlreadyQueued(tableName, request.carId);
      if (!existsRes.ok) {
        return existsRes.response;
      }
      if (existsRes.exists) {
        return {
          success: false,
          error_code: ERROR_CODES.CAR_ALREADY_IN_QUEUE,
          message: "Car is already in queue",
        };
      }

      // Determine next position in queue
      const nextPosition = await this.determineNextPosition(tableName);

      // Insert car into queue with collision handling for concurrent additions
      const insertRes = await this.insertQueueEntryWithRetries(tableName, request.carId, nextPosition);
      if (!insertRes.ok) {
        return insertRes.response;
      }

      return createSuccessResponse(insertRes.data);
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to add car to queue",
      };
    }
  }

  /**
   * Retrieves queue for a specific seater capacity in FIFO order
   * @param seater - Vehicle seater capacity (4, 6, 7, etc.)
   * @returns Promise resolving to queue view with car details
   */
  static async getQueueBySeater(
    seater: number,
  ): Promise<ApiResponse<QueueView>> {
    try {
      const tn = this.getTableNameOrError(seater);
      if (!tn.ok) {
        return tn.response;
      }
      const tableName = tn.tableName;
      
      // Join seater-specific queue table with car info to get complete car details
      const { data, error } = await supabase
        .from(tableName)
        .select(
          `
          carId:carid,
          position,
          timestampAdded:timestampadded,
          carinfo:carid (
            plateNo:plateno,
            driverName:drivername,
            carModel:carmodel
          )
        `,
        )
        .order("position"); // Maintain FIFO order

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      // Normalize rows into a QueueView using shared utility
      const queueView = normalizeQueueRowsToView(data || [], seater);
      return { success: true, data: queueView };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch queue",
      };
    }
  }

  /**
   * Retrieves all active queues for all seater types
   * @returns Promise resolving to array of queue views for each seater capacity
   */
  static async getAllQueues(): Promise<ApiResponse<QueueView[]>> {
    try {
      const seaters = SEATER_TYPES as unknown as number[]; // Standard seater capacities supported

      // Fetch queue data for each seater type in parallel to reduce latency
      const results = await Promise.all(
        seaters.map((seater) => this.getQueueBySeater(seater))
      );

      // Preserve order by iterating original seater list
      const queues: QueueView[] = [];
      results.forEach((result) => {
        if (result.success && result.data) {
          queues.push(result.data);
        }
      });

      return { success: true, data: queues };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch all queues",
      };
    }
  }

  /**
   * Maintenance function to fix queue position numbering gaps
   * Ensures positions are consecutive starting from 1 (critical for FIFO integrity)
   * @param seater - Optional specific seater type to fix, or all if not provided
   * @returns Promise resolving to count of updated position records
   */
  static async fixQueuePositions(
    seater?: number
  ): Promise<ApiResponse<{ updated: number }>> {
    try {
      const seatersToFix = seater ? [seater] : (SEATER_TYPES as unknown as number[]);
      let totalUpdated = 0;

      for (const seaterType of seatersToFix) {
        const updated = await this.renumberQueueForSeater(seaterType);
        totalUpdated += updated;
      }

      return { success: true, data: { updated: totalUpdated } };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fix queue positions",
      };
    }
  }

  /**
   * Clears all cars from a specific seater queue.
   * @param seater - The seater capacity to clear (e.g., 4, 5, 6, 7, 8)
   * @returns Number of entries cleared
   */
  static async clearQueueBySeater(
    seater: number,
  ): Promise<ApiResponse<{ cleared: number }>> {
    try {
      const tn = this.getTableNameOrError(seater);
      if (!tn.ok) {
        return tn.response;
      }
      const tableName = tn.tableName;
      
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .select("queueid"); // Return deleted rows so we can count

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      const cleared = (data || []).length;
      return { success: true, data: { cleared } };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to clear queue",
      };
    }
  }
}

/**
 * Booking Service - Intelligent taxi assignment with optimized passenger-vehicle matching
 * 
 * This service implements a sophisticated allocation algorithm that maximizes vehicle utilization
 * while maintaining strict FIFO queue integrity across seater-specific queues.
 * 
 * ## OPTIMIZED ALLOCATION WITH MOVE-UP ALGORITHM
 * 
 * ### 🏗️ Architecture Overview:
 * The system uses **individual database tables** for each vehicle capacity:
 * ```
 * ┌─────────────────┬──────────────────────┬───────────────────┐
 * │ Seater Type     │ Database Table       │ Typical Use Case  │
 * ├─────────────────┼──────────────────────┼───────────────────┤
 * │ 4-seater        │ queue_4seater        │ 1-4 passengers    │
 * │ 5-seater        │ queue_5seater        │ 5 passengers      │
 * │ 6-seater        │ queue_6seater        │ 6 passengers      │
 * │ 7-seater        │ queue_7seater        │ 7 passengers      │
 * │ 8-seater        │ queue_8seater        │ 8 passengers      │
 * └─────────────────┴──────────────────────┴───────────────────┘
 * ```
 * 
 * ### 🎯 Smart Allocation Rules:
 * **Priority Algorithm**: Always try the optimal seater first, then move up:
 * - **1-4 passengers**: 4→5→6→7→8 seater priority
 * - **5 passengers**: 5→6→7→8 seater priority  
 * - **6 passengers**: 6→7→8 seater priority
 * - **7 passengers**: 7→8 seater priority
 * - **8 passengers**: 8-seater only (required)
 * 
 * ### 📊 Efficiency Examples:
 * ```typescript
 * Passenger Count → Vehicle → Efficiency → Rating
 * 3 passengers   → 4-seater →    75%   → Good ✅
 * 3 passengers   → 6-seater →    50%   → Fair 😐
 * 5 passengers   → 5-seater →   100%   → Perfect 🎯
 * 7 passengers   → 8-seater →    88%   → Optimal ✅
 * ```
 * 
 * ### 🔄 Queue Processing Flow:
 * 1. **Validate Input**: Check passenger count (1-8)
 * 2. **Determine Priority**: Calculate optimal seater and fallback sequence
 * 3. **Search Queues**: Try each queue in priority order (FIFO within each)
 * 4. **Assign Vehicle**: Remove from queue and return car details
 * 5. **Auto-Repair**: Fix position gaps to maintain queue integrity
 * 
 * ### 🏆 Key Benefits:
 * - **Queue Isolation**: Independent tables prevent cross-contamination
 * - **Optimal Matching**: Always tries best-fit vehicle first
 * - **Performance**: Table-specific indexes for faster queries
 * - **Scalability**: No cross-table locks or dependencies
 * - **Reliability**: Built-in position repair and verification
 * 
 * @example
 * ```typescript
 * // Assign taxi for 3 passengers
 * const assignment = await BookingService.assignTaxi(3, "Airport Terminal 1");
 * if (assignment.success) {
 *   const { car, queuePosition } = assignment.data;
 *   console.log(`Assigned ${car.plateNo} (was position ${queuePosition})`);
 *   console.log(`Driver: ${car.driverName}, Phone: ${car.driverPhone}`);
 * }
 * 
 * // Check allocation efficiency
 * const result = await BookingService.assignTaxi(5);
 * // Will try 5-seater first (100% efficiency)
 * // Falls back to 6-seater (83% efficiency) if 5-seater unavailable
 * ```
 * 
 * @version 0.1.0
 * @since 2025-09-06
 * @see {@link QueueService} For queue management operations
 */
export class BookingService {
  /**
   * Validates passenger count for taxi assignment
   * @param {number} passengerCount - Number of passengers requiring transportation
   * @returns {ApiResponse<null>|null} Error response if invalid, null if valid
   */
  private static validatePassengerCount(passengerCount: number): ApiResponse<null> | null {
    if (!ValidationHelpers.isValidPassengerCount(passengerCount)) {
      return createErrorResponse(
        ERROR_CODES.INVALID_SEATER_INPUT,
        `Passenger count must be between ${VALIDATION_RULES.PASSENGER_COUNT.MIN} and ${VALIDATION_RULES.PASSENGER_COUNT.MAX}`
      );
    }
    return null;
  }

  /**
   * Determines the optimal seater capacity and allocation priority for passenger count
   * @param {number} passengerCount - Number of passengers
   * @returns {object} Allocation strategy with optimum seater and priority sequence
   */
  private static determineAllocationStrategy(passengerCount: number): {
    optimumSeater: number;
    allocationPriority: number[];
  } {
    // Determine optimum seater based on passenger count
    let optimumSeater: number;
    if (passengerCount <= 4) {
      optimumSeater = 4;
    } else if (passengerCount === 5) {
      optimumSeater = 5;
    } else if (passengerCount === 6) {
      optimumSeater = 6;
    } else if (passengerCount === 7) {
      optimumSeater = 7;
    } else {
      optimumSeater = 8;
    }
    
    // Create priority order: optimum seater first, then move up
    const allocationPriority: number[] = [];
    for (let seater = optimumSeater; seater <= 8; seater++) {
      if (SEATER_QUEUE_TABLES[seater]) {
        allocationPriority.push(seater);
      }
    }
    
    return { optimumSeater, allocationPriority };
  }

  /**
   * Searches queues in priority order to find an available vehicle
   * @param {number[]} allocationPriority - Seater types in priority order
   * @param {number} optimumSeater - The optimal seater type for efficiency
   * @returns {Promise<object>} Assignment result with car info and queue details
   */
  private static async searchQueuesForAvailableVehicle(
    allocationPriority: number[],
    optimumSeater: number
  ): Promise<{
    assignedCar: CarInfo | null;
    queueEntry: any;
    queuePosition: number;
    allocatedSeaterType: number;
  }> {
    let assignedCar: CarInfo | null = null;
    let queueEntry: any = null;
    let queuePosition = 0;
    let allocatedSeaterType = 0;

    // Try allocation in priority order (optimum first, then move up)
    for (const seater of allocationPriority) {
      logger.log(`🔍 Checking ${seater}-seater queue...`);
      const { data: queueData, error: queueError } = await BookingService.getNextAvailableEntry(seater);

      // Found a car in this seater type queue
      if (queueData && !queueError && queueData.carinfo) {
        queueEntry = queueData;
        // Handle Supabase join result (could be array or object)
        const carinfo = Array.isArray(queueData.carinfo) ? queueData.carinfo[0] : queueData.carinfo;
        if (carinfo) {
          assignedCar = carinfo;
          queuePosition = queueData.position;
          allocatedSeaterType = seater;
          const isOptimum = seater === optimumSeater;
          logger.log(`✅ ${isOptimum ? 'OPTIMUM' : 'MOVE-UP'} assignment: ${seater}-seater taxi: ${carinfo.plateNo} (Position: ${queuePosition})`);
          break; // Use first available car (FIFO within priority)
        }
      } else {
        logger.log(`⏳ No cars available in ${seater}-seater queue`);
      }
    }

    return { assignedCar, queueEntry, queuePosition, allocatedSeaterType };
  }

  /**
   * Removes assigned car from queue and verifies removal
   * @param {any} queueEntry - Queue entry to remove
   * @param {number} allocatedSeaterType - Seater type of the allocated vehicle
   * @returns {Promise<ApiResponse<null>|null>} Error response if failed, null if successful
   */
  private static async removeCarFromQueueAndVerify(
    queueEntry: any,
    allocatedSeaterType: number
  ): Promise<ApiResponse<null> | null> {
    // Remove car from the appropriate seater-specific queue
    const queueTableName = SEATER_QUEUE_TABLES[allocatedSeaterType];
    if (!queueTableName) {
      return createErrorResponse(
        ERROR_CODES.DB_CONNECTION_ERROR,
        "Invalid seater type for queue removal"
      );
    }

    const { error: removeError } = await supabase
      .from(queueTableName)
      .delete()
      .eq("queueid", queueEntry.queueId);

    if (removeError) {
      logger.error(`❌ Failed to remove car from queue: ${removeError.message}`);
      return createErrorResponse(
        ERROR_CODES.DB_CONNECTION_ERROR,
        `Failed to assign taxi: ${removeError.message}`
      );
    }

    // Verify the car was actually removed from queue
    if (queueTableName) {
      const { data: verifyQueue } = await supabase
        .from(queueTableName)
        .select("queueid")
        .eq("queueid", queueEntry.queueId)
        .maybeSingle();
        
      if (verifyQueue) {
        logger.error(`❌ Queue verification failed - car still in queue`);
        return createErrorResponse(
          ERROR_CODES.DB_CONNECTION_ERROR,
          "Assignment failed - please try again"
        );
      }
    }

    return null; // Success - no error
  }

  /**
   * Helper function to get allocation efficiency information
   * @param passengerCount - Number of passengers
   * @param allocatedSeater - Seater capacity of allocated vehicle
   * @returns Efficiency information object
   */
  private static getAllocationInfo(passengerCount: number, allocatedSeater: number) {
    const efficiency = Math.round((passengerCount / allocatedSeater) * 100);
    const wastedSeats = allocatedSeater - passengerCount;
    const isOptimal = allocatedSeater === passengerCount;
    const isPerfect = efficiency === 100;
    const isGood = efficiency >= 67; // 2/3 or more efficiency
    const isWasteful = efficiency < 50; // Less than half efficiency
    
    let rating: 'Perfect' | 'Optimal' | 'Good' | 'Fair' | 'Wasteful';
    let emoji: string;
    
    if (isPerfect) {
      rating = 'Perfect';
      emoji = '🎯';
    } else if (efficiency >= 80) {
      rating = 'Optimal';
      emoji = '✅';
    } else if (isGood) {
      rating = 'Good';
      emoji = '👍';
    } else if (efficiency >= 50) {
      rating = 'Fair';
      emoji = '😐';
    } else {
      rating = 'Wasteful';
      emoji = '⚠️';
    }
    
    return {
      efficiency,
      wastedSeats,
      isOptimal,
      isPerfect,
      isGood,
      isWasteful,
      rating,
      emoji
    };
  }

  /**
   * Fetches the next available queue entry for a given seater type with joined car info.
   * Returns the raw record (or null) and any error for the caller to handle identically.
   */
  private static async getNextAvailableEntry(seater: number): Promise<{ data: any | null; error: any | null }> {
    const tableName = SEATER_QUEUE_TABLES[seater];
    
    if (!tableName) {
      return { data: null, error: { message: `Invalid seater type: ${seater}` } };
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select(
        `
        queueId:queueid,
        carId:carid,
        position,
        timestampAdded:timestampadded,
        carinfo:carid (
          carId:carid,
          plateNo:plateno,
          driverName:drivername,
          driverPhone:driverphone,
          carModel:carmodel,
          seater
        )
      `
      )
      .order("position")
      .limit(1)
      .maybeSingle();
    return { data, error };
  }
  /**
   * Assigns the next available taxi from queue based on passenger count using optimized allocation
   * Removes assigned car from queue and returns car details
   * @param passengerCount - Number of passengers requiring transportation
   * @param destination - Optional destination string for record keeping
   * @returns Promise resolving to assigned car information and queue details
   */
  static async assignTaxi(
    passengerCount: number,
    destination?: string
  ): Promise<ApiResponse<{ car: CarInfo; queuePosition: number; destination?: string }>> {
    try {
      // Step 1: Validate input parameters
      const validationError = this.validatePassengerCount(passengerCount);
      if (validationError) {
        return validationError as any;
      }

      // Step 2: Determine allocation strategy (optimum seater + priority order)
      const { optimumSeater, allocationPriority } = this.determineAllocationStrategy(passengerCount);
      logger.log(`🎯 Optimized allocation for ${passengerCount} passengers - Priority: [${allocationPriority.join(' → ')}]`);

      // Step 3: Search queues for available vehicle
      const { assignedCar, queueEntry, queuePosition, allocatedSeaterType } = 
        await this.searchQueuesForAvailableVehicle(allocationPriority, optimumSeater);

      // Step 4: Check if any suitable vehicle was found
      if (!assignedCar || !queueEntry) {
        logger.log(`❌ No suitable taxis available for ${passengerCount} passengers in any queue`);
        return createErrorResponse(
          ERROR_CODES.NO_AVAILABLE_CAR,
          `No suitable taxis available for ${passengerCount} passengers. Please wait or try again later.`
        ) as any;
      }

      // Step 5: Log allocation efficiency analysis
      const allocationInfo = this.getAllocationInfo(passengerCount, allocatedSeaterType);
      logger.log(`🎯 Direct Assignment: ${allocationInfo.efficiency}% efficiency (${passengerCount}/${allocatedSeaterType} seats, ${allocationInfo.wastedSeats} unused)`);

      // Step 6: Remove car from queue and verify
      const removalError = await this.removeCarFromQueueAndVerify(queueEntry, allocatedSeaterType);
      if (removalError) {
        return removalError as any;
      }

      logger.log(`✅ Successfully assigned ${allocatedSeaterType}-seater taxi to ${passengerCount} passengers`);

      // Step 7: Fix queue positions to maintain FIFO integrity
      await QueueService.fixQueuePositions(assignedCar.seater);

      // Step 8: Return successful assignment
      return createSuccessResponse({
        car: assignedCar,
        queuePosition,
        ...(destination && { destination }),
      });
    } catch (error) {
      return createErrorResponse(
        ERROR_CODES.DB_CONNECTION_ERROR,
        "Failed to assign taxi",
        error as Error
      ) as any;
    }
  }
}

/**
 * QueuePal Management Service
 */
export class QueuePalService {
  // Get all QueuePals
  static async getAllQueuePals(): Promise<ApiResponse<QueuePal[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .select(
          "queuePalId:queuepalid, name, contact, assignedBy:assignedby, created_at, updated_at",
        )
        .order("name");

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch QueuePals",
      };
    }
  }

  // Add new QueuePal
  static async addQueuePal(
    queuePal: Omit<QueuePal, "queuePalId">,
  ): Promise<ApiResponse<QueuePal>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .insert([queuePal])
        .select(
          "queuePalId:queuepalid, name, contact, assignedBy:assignedby, created_at, updated_at",
        )
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to add QueuePal",
      };
    }
  }

  // Update QueuePal
  static async updateQueuePal(
    queuePalId: string,
    updates: Partial<QueuePal>,
  ): Promise<ApiResponse<QueuePal>> {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.contact !== undefined) dbUpdates.contact = updates.contact;
      if (updates.assignedBy !== undefined)
        dbUpdates.assignedby = updates.assignedBy;

      const { data, error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .update(dbUpdates)
        .eq("queuepalid", queuePalId)
        .select(
          "queuePalId:queuepalid, name, contact, assignedBy:assignedby, created_at, updated_at",
        )
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to update QueuePal",
      };
    }
  }

  // Delete QueuePal
  static async deleteQueuePal(
    queuePalId: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.QUEUE_PAL)
        .delete()
        .eq("queuepalid", queuePalId);

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to delete QueuePal",
      };
    }
  }
}
