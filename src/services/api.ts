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

/**
 * Car Management Service - Handles all car-related database operations
 * Used primarily by Admin users for managing the vehicle fleet
 */
export class CarService {
  /**
   * Retrieves cars with pagination and optional search functionality
   * @param page - Page number (1-indexed) for pagination
   * @param pageSize - Number of cars to return per page (default: 50)
   * @param searchTerm - Optional search string to filter cars by plate, driver name, or model
   * @returns Promise resolving to paginated car data with metadata
   */
  static async getCars(
    page: number = 1,
    pageSize: number = 50,
    searchTerm: string = ""
  ): Promise<ApiResponse<{ cars: CarInfo[]; hasMore: boolean; total: number }>> {
    try {
      // Calculate offset for pagination (zero-indexed for database queries)
      const offset = (page - 1) * pageSize;
      
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
          .range(offset, offset + pageSize - 1);

        if (error) {
          return {
            success: false,
            error_code: ERROR_CODES.DB_CONNECTION_ERROR,
            message: error.message,
          };
        }

        const hasMore = count ? offset + pageSize < count : false;
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
        range: { from: offset, to: offset + pageSize - 1 },
      });

      if (res.error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: res.error.message,
        };
      }

      const rows = res.rows || [];
      const totalCount = res.count || 0;

      // Determine if there are more pages available
      const hasMore = totalCount ? offset + pageSize < totalCount : false;
      
      return { 
        success: true, 
        data: {
          cars: (rows as unknown as CarInfo[]),
          hasMore,
          total: totalCount
        }
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch cars",
      };
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
        return {
          success: false,
          error_code: result.error_code || ERROR_CODES.DB_CONNECTION_ERROR,
          message: legacyMessage,
        };
      }
      return result;
    } catch (_err) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to fetch cars",
      };
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
 * Queue Management Service - Handles FIFO queue operations
 * Used by QueuePal users to manage taxi queues by seater capacity
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
    const tableName = SEATER_QUEUE_TABLES[seater];
    if (!tableName) {
      return {
        ok: false,
        response: {
          success: false,
          error_code: ERROR_CODES.INVALID_SEATER_INPUT,
          message: `Invalid seater type: ${seater}`,
        },
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
          response: {
            success: false,
            error_code: ERROR_CODES.CAR_NOT_FOUND,
            message: "Car not registered in system",
          },
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
   * Inserts Queue Entry with Concurrent Collision Handling
   * 
   * This method implements a robust queue insertion algorithm that handles race conditions
   * when multiple cars are simultaneously added to the same queue position. It uses a retry
   * mechanism with position increment to resolve PostgreSQL unique constraint violations.
   * 
   * **Algorithm Details:**
   * - Attempt insertion at calculated position
   * - On position collision (23505 error), increment position and retry
   * - Maximum of 3 attempts to prevent infinite loops
   * - Maintains FIFO integrity by using consecutive positions
   * 
   * **Concurrency Handling:**
   * This handles the race condition where:
   * 1. Car A calculates next position as 5
   * 2. Car B also calculates next position as 5 (before Car A inserts)
   * 3. Car A inserts at position 5 successfully
   * 4. Car B attempts position 5, gets constraint violation
   * 5. Car B retries at position 6, succeeds
   * 
   * @param tableName - Target seater-specific queue table (e.g., "queue_4seater")
   * @param carId - Unique identifier of car to add to queue
   * @param basePosition - Initial position calculated from queue state
   * @returns Promise with success data or structured error response
   * @throws Never throws - all errors are captured and returned as ApiResponse
   */
  private static async insertQueueEntryWithRetries(
    tableName: string,
    carId: string,
    basePosition: number
  ): Promise<{ ok: true; data: any } | { ok: false; response: ApiResponse<never> }> {
    let insertAttempts = 0;
    const maxRetries = 3; // Limit retries to prevent infinite loops

    // Retry loop to handle concurrent insertions at the same position
    while (insertAttempts < maxRetries) {
      // Calculate position for this attempt (base + retry count)
      // This ensures that if position N is taken, we try N+1, then N+2, etc.
      const attemptPosition = basePosition + insertAttempts;
      
      logger.log(`🔄 Queue insertion attempt ${insertAttempts + 1}/${maxRetries} at position ${attemptPosition}`);
      
      const { data: insertData, error } = await supabase
        .from(tableName)
        .insert([
          {
            carid: carId,
            position: attemptPosition, // Incremented position for collision resolution
            timestampadded: new Date().toISOString(), // Timestamp for audit trail
          },
        ])
        .select(
          "queueId:queueid, carId:carid, position, timestampAdded:timestampadded",
        )
        .single();

      // Success case - car successfully added to queue
      if (!error) {
        logger.log(`✅ Car ${carId} successfully queued at position ${attemptPosition}`);
        return { ok: true, data: insertData };
      }

      // Handle PostgreSQL unique constraint violation on position
      // Error code 23505 indicates unique_violation in PostgreSQL
      if (error.code === "23505" && error.message.includes("position")) {
        logger.log(`⚠️ Position collision at ${attemptPosition}, retrying with incremented position`);
        insertAttempts++;
        continue; // Retry with next available position
      }

      // For non-position related errors (e.g., network, auth, schema issues), fail immediately
      // These errors won't be resolved by retrying with different positions
      logger.error(`❌ Non-recoverable insertion error:`, error);
      return {
        ok: false,
        response: {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        },
      };
    }

    // All retry attempts exhausted - this indicates severe queue congestion
    // or a system issue that prevented successful insertion
    logger.error(`❌ Queue insertion failed after ${maxRetries} attempts for car ${carId}`);
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
   * Add Car to Queue - Core FIFO Queue Management Function
   * 
   * Adds a taxi to the appropriate seater-specific queue while maintaining strict FIFO ordering.
   * This is the primary entry point for QueuePal users to register taxis for passenger pickup.
   * 
   * **Business Logic Flow:**
   * 1. **Validation**: Verify car exists in system and is not suspended
   * 2. **Queue Resolution**: Determine correct seater-specific queue table
   * 3. **Duplicate Prevention**: Ensure car isn't already queued
   * 4. **Position Calculation**: Determine next FIFO position
   * 5. **Concurrent Insertion**: Add car with collision handling
   * 
   * **Queue Table Structure:**
   * - Each seater capacity has dedicated table (queue_4seater, queue_5seater, etc.)
   * - Positions are consecutive integers starting from 1
   * - FIFO order is maintained by position ASC ordering
   * 
   * **Error Handling:**
   * - Car not found: Returns CAR_NOT_FOUND
   * - Car suspended: Returns UNAUTHORIZED_ACCESS
   * - Already queued: Returns CAR_ALREADY_IN_QUEUE
   * - Database issues: Returns DB_CONNECTION_ERROR
   * 
   * **Concurrency Safety:**
   * Uses retry mechanism to handle race conditions when multiple cars
   * are added simultaneously to the same queue position.
   * 
   * @param request - Queue addition request containing car identifier
   * @param request.carId - Unique identifier of car to add to queue
   * @returns Promise resolving to created queue entry with position and timestamp
   * @throws Never throws - all errors returned as structured ApiResponse
   * 
   * @example
   * ```typescript
   * // Add car to queue
   * const result = await QueueService.addCarToQueue({ carId: "CAR123" });
   * 
   * if (result.success) {
   *   console.log(`Car queued at position ${result.data.position}`);
   *   console.log(`Queue ID: ${result.data.queueId}`);
   * } else {
   *   console.error(`Queue error: ${result.message}`);
   * }
   * ```
   */
  static async addCarToQueue(
    request: QueueAddRequest,
  ): Promise<ApiResponse<Queue>> {
    try {
      logger.log(`🚗 Starting queue addition for car: ${request.carId}`);
      
      // STEP 1: VALIDATION - Verify car exists and retrieve seater information
      // This ensures we have valid car data before proceeding with queue operations
      const carResult = await this.fetchCarDataForQueue(request.carId);
      if (!carResult.ok) {
        logger.error(`❌ Car validation failed for ${request.carId}`);
        return carResult.response;
      }
      const carData = carResult.carData;
      logger.log(`✅ Car validation successful: ${carData.seater}-seater vehicle`);

      // STEP 2: SUSPENSION CHECK - Prevent adding suspended/inactive cars
      // Active status check protects against queuing cars that are out of service
      if (carData && carData.is_active === false) {
        logger.warn(`🚫 Attempted to queue suspended car: ${request.carId}`);
        return {
          success: false,
          error_code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: "Car is suspended and cannot be queued",
        };
      }

      // STEP 3: QUEUE TABLE RESOLUTION - Determine target seater-specific table
      // Each seater capacity (4, 5, 6, 7, 8) has its own dedicated queue table
      const tn = this.getTableNameOrError(carData.seater);
      if (!tn.ok) {
        logger.error(`❌ Invalid seater type: ${carData.seater}`);
        return tn.response;
      }
      const tableName = tn.tableName;
      logger.log(`🎯 Target queue table: ${tableName}`);

      // STEP 4: DUPLICATE PREVENTION - Check if car is already queued
      // Prevents double-queuing which would break FIFO integrity
      const existsRes = await this.isCarAlreadyQueued(tableName, request.carId);
      if (!existsRes.ok) {
        logger.error(`❌ Failed to check queue status for car ${request.carId}`);
        return existsRes.response;
      }
      if (existsRes.exists) {
        logger.warn(`🔄 Car ${request.carId} is already in ${tableName}`);
        return {
          success: false,
          error_code: ERROR_CODES.CAR_ALREADY_IN_QUEUE,
          message: "Car is already in queue",
        };
      }

      // STEP 5: POSITION CALCULATION - Determine next FIFO position
      // Calculates the next available position to maintain queue ordering
      const nextPosition = await this.determineNextPosition(tableName);
      logger.log(`📍 Calculated next position: ${nextPosition}`);

      // STEP 6: CONCURRENT INSERTION - Add car with collision handling
      // Uses retry mechanism to handle race conditions during simultaneous insertions
      const insertRes = await this.insertQueueEntryWithRetries(
        tableName, 
        request.carId, 
        nextPosition
      );
      if (!insertRes.ok) {
        logger.error(`❌ Queue insertion failed for car ${request.carId}`);
        return insertRes.response;
      }

      logger.log(`🎉 Successfully added car ${request.carId} to queue at position ${insertRes.data.position}`);
      return { success: true, data: insertRes.data };
      
    } catch (error) {
      // GLOBAL ERROR HANDLER - Catches any unexpected errors
      // Provides consistent error response structure for all failure modes
      logger.error(`💥 Unexpected error in addCarToQueue for ${request.carId}:`, error);
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
 * Booking Service - Handles optimized taxi assignments from individual seater queue tables
 * 
 * OPTIMIZED ALLOCATION WITH MOVE-UP ALGORITHM:
 * ============================================
 * 
 * The system uses individual database tables for each seater type with optimized allocation:
 * 
 * 1. INDIVIDUAL QUEUE TABLES:
 *    - queue_4seater: Dedicated table for 4-seater vehicles
 *    - queue_5seater: Dedicated table for 5-seater vehicles
 *    - queue_6seater: Dedicated table for 6-seater vehicles
 *    - queue_7seater: Dedicated table for 7-seater vehicles
 *    - queue_8seater: Dedicated table for 8-seater vehicles
 * 
 * 2. OPTIMIZED ALLOCATION RULES:
 *    - 1-4 passengers: Try 4-seater → 5-seater → 6-seater → 7-seater → 8-seater
 *    - 5 passengers: Try 5-seater → 6-seater → 7-seater → 8-seater
 *    - 6 passengers: Try 6-seater → 7-seater → 8-seater
 *    - 7 passengers: Try 7-seater → 8-seater
 *    - 8 passengers: Only 8-seater
 * 
 * 3. ALLOCATION EXAMPLES:
 *    - 1 passenger: Optimum 4-seater (100% match), fallback to larger if needed
 *    - 3 passengers: Optimum 4-seater (75% efficiency), move up if not available
 *    - 5 passengers: Optimum 5-seater (100% match), fallback to 6/7/8-seater
 *    - 7 passengers: Optimum 7-seater (100% match), fallback to 8-seater
 *    - 8 passengers: Only 8-seater (100% match - required)
 * 
 * 4. BENEFITS:
 *    - Individual tables ensure complete queue isolation
 *    - Try optimum seater first for best efficiency
 *    - Move up to larger seaters only when needed
 *    - Better database performance with separate tables
 *    - Clear assignment logic: optimum first, then move up
 * 
 * 5. QUEUE MANAGEMENT:
 *    - Each table maintains independent FIFO order
 *    - Position numbering is consecutive within each table
 *    - No cross-table dependencies
 *    - Better performance with table-specific indexes
 */
export class BookingService {
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
      // Validate passenger count against system constraints
      if (passengerCount <= 0 || passengerCount > 8) {
        return {
          success: false,
          error_code: ERROR_CODES.INVALID_SEATER_INPUT,
          message: "Passenger count must be between 1 and 8",
        };
      }

      // OPTIMIZED ALLOCATION WITH MOVE-UP LOGIC
      // Try optimum seater first, then move up to larger seaters if not available
      let optimumSeater: number;
      
      // Determine optimum seater based on passenger count
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
      
      logger.log(`🎯 Optimized allocation for ${passengerCount} passengers - Priority: [${allocationPriority.join(' → ')}]`);

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

      if (!assignedCar || !queueEntry) {
        logger.log(`❌ No suitable taxis available for ${passengerCount} passengers in any queue`);
        
        return {
          success: false,
          error_code: ERROR_CODES.NO_AVAILABLE_CAR,
          message: `No suitable taxis available for ${passengerCount} passengers. Please wait or try again later.`,
        };
      }

      // Calculate allocation efficiency with detailed analysis
      const allocationInfo = BookingService.getAllocationInfo(passengerCount, allocatedSeaterType);
      
      logger.log(`🎯 Direct Assignment: ${allocationInfo.efficiency}% efficiency (${passengerCount}/${allocatedSeaterType} seats, ${allocationInfo.wastedSeats} unused)`);
      
      // Note: With direct seater matching, efficiency may vary but queues remain properly isolated

      // Remove car from the appropriate seater-specific queue
      const queueTableName = SEATER_QUEUE_TABLES[allocatedSeaterType];
      if (!queueTableName) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: "Invalid seater type for queue removal",
        };
      }
      const { error: removeError } = await supabase
        .from(queueTableName)
        .delete()
        .eq("queueid", queueEntry.queueId);

      if (removeError) {
        logger.error(`❌ Failed to remove car from queue: ${removeError.message}`);
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: `Failed to assign taxi: ${removeError.message}`,
        };
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
          return {
            success: false,
            error_code: ERROR_CODES.DB_CONNECTION_ERROR,
            message: "Assignment failed - please try again",
          };
        }
      }

      logger.log(`✅ Successfully assigned ${allocatedSeaterType}-seater taxi to ${passengerCount} passengers`);

      // Fix queue positions after removing car to ensure consecutive numbering
      await QueueService.fixQueuePositions(assignedCar.seater);

      return {
        success: true,
        data: {
          car: assignedCar,
          queuePosition,
          ...(destination && { destination }),
        },
      };
    } catch (error) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to assign taxi",
      };
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
