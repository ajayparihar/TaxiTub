// TaxiTub Module: Supabase Configuration
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Initial Supabase setup based on Deployment & Architecture Document

/// <reference types="../vite-env.d.ts" />
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Environment Configuration
 * Loads connection parameters from environment variables with fallbacks
 * Supports development mode with placeholder values for easier setup
 */
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder_anon_key";

/**
 * URL validation utility to ensure proper Supabase URL format
 * Prevents runtime errors from malformed URLs
 * @param url - URL string to validate
 * @returns boolean indicating if URL is properly formatted
 */
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false; // Invalid URL format
  }
};

/**
 * Configuration validation and fallback logic
 * Ensures application can start even with missing or invalid credentials
 * Facilitates development and testing environments
 */
const validUrl = isValidUrl(supabaseUrl)
  ? supabaseUrl
  : "https://placeholder.supabase.co"; // Safe fallback for development

const validKey =
  supabaseAnonKey && supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
    ? supabaseAnonKey
    : "placeholder_anon_key"; // Prevent using template placeholder values

/**
 * Development warning system
 * Alerts developers when using placeholder credentials
 * Helps prevent accidental deployment with invalid configuration
 */
if (
  validUrl === "https://placeholder.supabase.co" ||
  validKey === "placeholder_anon_key"
) {
  console.warn(
    "⚠️ TaxiTub: Using placeholder Supabase credentials. Please update your .env file with real values.",
    "\nRequired environment variables:",
    "\n- VITE_SUPABASE_URL",
    "\n- VITE_SUPABASE_ANON_KEY"
  );
}

/**
 * Supabase client instance with optimized configuration for TaxiTub
 * 
 * Configuration choices:
 * - No persistent sessions (MVP requirement - stateless operations)
 * - No auto token refresh (reduces complexity for queue management use case)
 * - Public schema (standard Supabase setup)
 * 
 * This client handles all database operations for:
 * - Car management (CRUD operations)
 * - Queue management (FIFO operations)
 * - QueuePal staff management
 */
export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,    // MVP doesn't require persistent user sessions
    autoRefreshToken: false,  // Simplifies auth flow for queue management focus
  },
  db: {
    schema: "public",         // Default PostgreSQL schema
  },
});

/**
 * Database Table Name Constants
 * Centralized table names to prevent typos and enable easy refactoring
 * Maps to PostgreSQL tables as defined in the database schema
 */
export const TABLES = {
  CAR_INFO: "carinfo",                    // Vehicle registration and driver information
  QUEUE_4SEATER: "queue_4seater",        // 4-seater taxi queue with FIFO positioning
  QUEUE_5SEATER: "queue_5seater",        // 5-seater taxi queue with FIFO positioning
  QUEUE_6SEATER: "queue_6seater",        // 6-seater taxi queue with FIFO positioning
  QUEUE_7SEATER: "queue_7seater",        // 7-seater taxi queue with FIFO positioning
  QUEUE_8SEATER: "queue_8seater",        // 8-seater taxi queue with FIFO positioning
  QUEUE_PAL: "queuepal",                 // Queue manager staff records
  ADMIN: "admin",                        // Admin authentication table
} as const;

/**
 * Seater Queue Table Map
 * Dynamic mapping for seater numbers to table names
 * Enables programmatic queue table access
 */
export const SEATER_QUEUE_TABLES: Record<number, string> = {
  4: TABLES.QUEUE_4SEATER,
  5: TABLES.QUEUE_5SEATER,
  6: TABLES.QUEUE_6SEATER,
  7: TABLES.QUEUE_7SEATER,
  8: TABLES.QUEUE_8SEATER,
} as const;

/**
 * Supabase Remote Procedure Call (RPC) Function Names
 * Complex database operations implemented as PostgreSQL functions
 * Provides atomic operations for critical business logic
 * 
 * Note: These functions would be implemented as PostgreSQL stored procedures
 * for production deployment to ensure data consistency and performance
 */
export const RPC_FUNCTIONS = {
  ASSIGN_TAXI: "assign_taxi_to_passenger",     // Atomic taxi assignment with queue removal
  ADD_TO_QUEUE: "add_car_to_queue",           // Queue addition with position calculation
  GET_QUEUE_BY_SEATER: "get_queue_by_seater", // Optimized queue retrieval with car details
} as const;
