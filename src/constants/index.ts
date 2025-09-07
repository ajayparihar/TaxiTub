// TaxiTub Module: Application Constants
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Centralized constants for better maintainability

/**
 * Application Configuration
 */
export const APP_CONFIG = {
  NAME: "TaxiTub",
  VERSION: "0.1.0",
  DESCRIPTION: "Airport Taxi Queue Management System",
} as const;

/**
 * Seater Types Available
 */
export const SEATER_TYPES = [4, 5, 6, 7, 8] as const;
export type SeaterType = typeof SEATER_TYPES[number];


/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: "Admin",
  QUEUE_PAL: "QueuePal", 
  PASSENGER: "Passenger",
} as const;

/**
 * API Configuration
 */
export const API_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
  TIMEOUT: 30000, // 30 seconds
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  TOAST_DURATION: 5000,
  LOADING_DELAY: 300, // Show loading after 300ms
  DEBOUNCE_DELAY: 500,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION = {
  PLATE_NO_REGEX: /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{3,14}$/,
  MIN_PASSENGER_COUNT: 1,
  MAX_PASSENGER_COUNT: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  MIN_DESTINATION_LENGTH: 3,
  MAX_DESTINATION_LENGTH: 100,
} as const;

/**
 * Time and Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy HH:mm",
  SHORT: "MM/dd/yyyy",
  TIME_ONLY: "HH:mm",
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

/**
 * Queue Configuration
 */
export const QUEUE_CONFIG = {
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_QUEUE_SIZE: 50,
  POSITION_START: 1,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  VALIDATION_ERROR: "Please check your input and try again.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  NO_CARS_AVAILABLE: "No cars available for your request. Please try again later.",
  INVALID_PLATE_FORMAT: "Please enter a valid plate number format (e.g., DL01AB1234)",
  INVALID_PHONE_FORMAT: "Please enter a valid phone number",
  CAR_ALREADY_EXISTS: "A car with this plate number already exists",
  CAR_ALREADY_IN_QUEUE: "This car is already in the queue",
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  CAR_ADDED: "Car added successfully.",
  CAR_DELETED: "Car deleted.",
  QUEUE_PAL_ADDED: "Staff member added.",
  QUEUE_PAL_UPDATED: "Staff member updated.",
  QUEUE_PAL_DELETED: "Staff member deleted.",
  CAR_ADDED_TO_QUEUE: "Car added to queue.",
} as const;

/**
 * Loading Messages  
 */
export const LOADING_MESSAGES = {
  ADDING_CAR: "Adding car...",
  DELETING_CAR: "Deleting car...",
  ADDING_QUEUE_PAL: "Adding QueuePal...",
  UPDATING_QUEUE_PAL: "Updating QueuePal...",
  DELETING_QUEUE_PAL: "Deleting QueuePal...",
  ADDING_TO_QUEUE: "Adding to queue...",
  REFRESHING: "Refreshing...",
  LOADING: "Loading...",
} as const;
