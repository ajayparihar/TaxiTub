// TaxiTub Module: Trip Service
// Version: v1.0.0
// Last Updated: 2025-09-12
// Author: AI Agent
// Changelog: Initial Trip Service implementation for Trip Lifecycle tests

import { supabase, TABLES } from "../config/supabase";
import { ApiResponse, ERROR_CODES } from "../types";
import { logger } from "../utils/logger";

/**
 * Trip Entity - Core trip information
 */
export interface Trip {
  tripId: string;
  carId: string;
  passengerCount: number;
  destination: string;
  status: TripStatus;
  createdAt: string;
  completedAt?: string;
  driverName?: string;
  driverPhone?: string;
  plateNo?: string;
}

/**
 * Valid trip status values
 */
export type TripStatus = 'Pending' | 'Assigned' | 'DriverEnRoute' | 'InProgress' | 'Completed' | 'Cancelled';

/**
 * Trip Service - Handles all trip-related operations
 * Used for managing the lifecycle of trips from creation to completion
 */
export class TripService {
  /**
   * Creates a new trip with initial booking details
   * @param bookingDetails - Details of the booking including passenger count and destination
   * @returns Promise resolving to the created trip record
   */
  static async createTrip(
    bookingDetails: { passengerCount: number; destination: string; carId?: string }
  ): Promise<ApiResponse<Trip>> {
    try {
      const tripData = {
        passengerCount: bookingDetails.passengerCount,
        destination: bookingDetails.destination,
        status: 'Pending' as TripStatus,
        createdAt: new Date().toISOString(),
        ...(bookingDetails.carId && { carId: bookingDetails.carId, status: 'Assigned' as TripStatus })
      };

      const { data, error } = await supabase
        .from(TABLES.TRIP)
        .insert([tripData])
        .select(`
          tripId,
          carId,
          passengerCount,
          destination,
          status,
          createdAt,
          completedAt
        `)
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { success: true, data: data as Trip };
    } catch (error: any) {
      logger.error('Trip creation error:', error);
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: error.message || "Failed to create trip",
      };
    }
  }

  /**
   * Completes a trip and updates its status to Completed
   * @param tripId - Unique identifier for the trip to complete
   * @returns Promise resolving to the updated trip with completed status
   */
  static async completeTrip(tripId: string): Promise<ApiResponse<{
    status: TripStatus;
    completedAt: string;
    carAvailableForQueue: boolean;
  }>> {
    try {
      // Get trip details
      const { data: tripData, error: tripError } = await supabase
        .from(TABLES.TRIP)
        .select("tripId, carId, status")
        .eq("tripId", tripId)
        .single();

      if (tripError) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: `Failed to find trip: ${tripError.message}`,
        };
      }

      // Validate trip can be completed
      if (!tripData) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: "Trip not found",
        };
      }

      if (tripData.status === 'Completed') {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: "Trip has already been completed",
        };
      }

      // Complete the trip
      const completedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLES.TRIP)
        .update({
          status: 'Completed',
          completedAt
        })
        .eq("tripId", tripId)
        .select();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: `Failed to complete trip: ${error.message}`,
        };
      }

      // Create audit log entry
      await supabase
        .from('trip_audit')
        .insert({
          action: 'TRIP_COMPLETED',
          entityId: tripId,
          timestamp: completedAt,
          details: JSON.stringify({
            tripId,
            carId: tripData.carId,
            completedAt
          })
        })
        .select()
        .single();

      return {
        success: true,
        data: {
          status: 'Completed',
          completedAt,
          carAvailableForQueue: true
        }
      };
    } catch (error: any) {
      logger.error('Trip completion error:', error);
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: error.message || "Failed to complete trip",
      };
    }
  }

  /**
   * Updates trip status to a new state
   * @param tripId - Unique identifier for the trip to update
   * @param status - New status value
   * @returns Promise resolving to success/failure
   */
  static async updateTripStatus(
    tripId: string,
    status: TripStatus
  ): Promise<ApiResponse<{ status: TripStatus }>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRIP)
        .update({ status, updated_at: new Date().toISOString() })
        .eq("tripId", tripId)
        .select("status");

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { 
        success: true, 
        data: { 
          status: data[0].status 
        } 
      };
    } catch (error: any) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to update trip status",
      };
    }
  }

  /**
   * Gets trip history with optional filtering
   * @param options - Optional filters for trip history (driver, date range, status)
   * @returns Promise resolving to filtered trip records
   */
  static async getTripHistory(
    options: {
      driverName?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: TripStatus;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<ApiResponse<{
    trips: Trip[];
    pagination?: { currentPage: number; totalPages: number; totalItems: number };
  }>> {
    try {
      // Determine pagination parameters
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from(TABLES.TRIP)
        .select(`
          tripId,
          carId,
          passengerCount,
          destination,
          status,
          createdAt,
          completedAt,
          carinfo:carId (
            driverName:drivername,
            driverPhone:driverphone,
            plateNo:plateno
          )
        `, { count: 'exact' });

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.driverName) {
        query = query.eq('carinfo.drivername', options.driverName);
      }

      if (options.dateFrom) {
        query = query.gte('createdAt', options.dateFrom);
      }

      if (options.dateTo) {
        query = query.lte('createdAt', options.dateTo);
      }

      // Apply pagination and ordering
      const { data, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      // Process results and include car info
      const trips = (data || []).map(trip => {
        const carInfo = Array.isArray(trip.carinfo) ? trip.carinfo[0] : trip.carinfo;
        return {
          ...trip,
          driverName: carInfo?.driverName,
          driverPhone: carInfo?.driverPhone,
          plateNo: carInfo?.plateNo,
          carinfo: undefined // Remove nested structure
        };
      });

      // Calculate pagination info
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      return {
        success: true,
        data: {
          trips: trips as Trip[],
          pagination: {
            currentPage: page,
            totalPages,
            totalItems
          }
        }
      };
    } catch (error: any) {
      logger.error('Trip history error:', error);
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: error.message || "Failed to retrieve trip history",
      };
    }
  }

  /**
   * Gets detailed trip information by ID
   * @param tripId - Unique identifier for the trip
   * @returns Promise resolving to trip details with car information
   */
  static async getTripDetails(tripId: string): Promise<ApiResponse<Trip>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRIP)
        .select(`
          tripId,
          carId,
          passengerCount,
          destination,
          status,
          createdAt,
          completedAt,
          carinfo:carId (
            driverName:drivername,
            driverPhone:driverphone,
            plateNo:plateno
          )
        `)
        .eq('tripId', tripId)
        .single();

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      // Process result to flatten car info
      const carInfo = Array.isArray(data.carinfo) ? data.carinfo[0] : data.carinfo;
      const trip = {
        ...data,
        driverName: carInfo?.driverName,
        driverPhone: carInfo?.driverPhone,
        plateNo: carInfo?.plateNo,
        carinfo: undefined // Remove nested structure
      };

      return { success: true, data: trip as Trip };
    } catch (error: any) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to retrieve trip details",
      };
    }
  }

  /**
   * Cancels a trip that hasn't been completed
   * @param tripId - Unique identifier for the trip to cancel
   * @returns Promise resolving to success/failure
   */
  static async cancelTrip(tripId: string): Promise<ApiResponse<{ status: TripStatus }>> {
    try {
      // Verify trip can be cancelled
      const { data: tripData, error: tripError } = await supabase
        .from(TABLES.TRIP)
        .select("status")
        .eq("tripId", tripId)
        .single();

      if (tripError) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: `Failed to find trip: ${tripError.message}`,
        };
      }

      if (tripData.status === 'Completed') {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: "Cannot cancel a completed trip",
        };
      }

      // Update trip status to cancelled
      const { data, error } = await supabase
        .from(TABLES.TRIP)
        .update({ 
          status: 'Cancelled',
          updated_at: new Date().toISOString()
        })
        .eq("tripId", tripId)
        .select("status");

      if (error) {
        return {
          success: false,
          error_code: ERROR_CODES.DB_CONNECTION_ERROR,
          message: error.message,
        };
      }

      return { 
        success: true, 
        data: { 
          status: 'Cancelled'
        } 
      };
    } catch (error: any) {
      return {
        success: false,
        error_code: ERROR_CODES.DB_CONNECTION_ERROR,
        message: "Failed to cancel trip",
      };
    }
  }
}
