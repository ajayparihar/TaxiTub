/**
 * Test Configuration for Node.js Environment
 * Compatible with tsx for testing CRUD operations
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variables for Node.js (process.env instead of import.meta.env)
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "placeholder_anon_key";

/**
 * URL validation utility
 */
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validUrl = isValidUrl(supabaseUrl) ? supabaseUrl : "https://placeholder.supabase.co";
const validKey = supabaseAnonKey && supabaseAnonKey !== "placeholder_anon_key" ? supabaseAnonKey : "placeholder_anon_key";

/**
 * Development warning
 */
if (validUrl === "https://placeholder.supabase.co" || validKey === "placeholder_anon_key") {
  console.warn("⚠️ TaxiTub Testing: Using placeholder Supabase credentials from environment variables");
  console.warn("Make sure your .env file contains valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
}

/**
 * Test Supabase client
 */
export const supabase = createClient(validUrl, validKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: "public",
  },
});

/**
 * Database Table Names
 */
export const TABLES = {
  CAR_INFO: "carinfo",
  QUEUE_4SEATER: "queue_4seater",
  QUEUE_5SEATER: "queue_5seater",
  QUEUE_6SEATER: "queue_6seater",
  QUEUE_7SEATER: "queue_7seater",
  QUEUE_8SEATER: "queue_8seater",
  QUEUE_PAL: "queuepal",
  ADMIN: "admin",
} as const;

/**
 * Seater Queue Table Map
 */
export const SEATER_QUEUE_TABLES: Record<number, string> = {
  4: TABLES.QUEUE_4SEATER,
  5: TABLES.QUEUE_5SEATER,
  6: TABLES.QUEUE_6SEATER,
  7: TABLES.QUEUE_7SEATER,
  8: TABLES.QUEUE_8SEATER,
} as const;

/**
 * Test environment info
 */
export const getTestEnvironmentInfo = () => {
  return {
    supabaseUrl: validUrl,
    hasValidCredentials: validUrl !== "https://placeholder.supabase.co" && validKey !== "placeholder_anon_key",
    nodeVersion: process.version,
    environment: 'test'
  };
};
