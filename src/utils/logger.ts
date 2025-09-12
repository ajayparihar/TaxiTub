// TaxiTub Module: Logger Utility
// Version: v0.1.0
// Last Updated: 2025-09-07
// Purpose: Gate verbose logs to development builds while allowing error logs in all environments.

/**
 * Environment-Aware Logger Utility
 * 
 * Provides conditional logging functionality that respects the build environment.
 * This utility ensures that verbose debug information is only shown during development,
 * while critical error messages are always displayed regardless of the environment.
 * 
 * **Key Features:**
 * - Development-only verbose logging (log, warn)
 * - Always-visible error logging for production debugging
 * - Vite environment variable integration
 * - Zero-overhead in production builds when using tree-shaking
 * 
 * **Environment Behavior:**
 * - **Development**: All log levels are active (log, warn, error)
 * - **Production**: Only error logs are displayed
 * 
 * **Usage Examples:**
 * ```typescript
 * import { logger } from './utils/logger';
 * 
 * // Development-only logs (not shown in production)
 * logger.log('Queue processing started for', seaterType);
 * logger.warn('Performance threshold exceeded:', duration);
 * 
 * // Always visible (shown in all environments)
 * logger.error('Database connection failed:', error.message);
 * ```
 * 
 * @module Logger
 */
export const logger = {
  /**
   * Development-Only Information Logging
   * 
   * Logs informational messages that are useful during development and debugging.
   * These messages are automatically filtered out in production builds to reduce
   * console noise and potential security concerns.
   * 
   * **Use Cases:**
   * - Debug information for development
   * - Function entry/exit tracking
   * - State change notifications
   * - API response logging
   * 
   * @param args - Any number of arguments to log (same as console.log)
   * @example
   * ```typescript
   * logger.log('User authenticated:', user.id);
   * logger.log('Queue state:', { position: 1, seater: 4 });
   * logger.log('Processing', itemCount, 'items');
   * ```
   */
  log: (...args: any[]) => {
    // Check Vite development environment flag
    // import.meta.env.DEV is provided by Vite (ES modules)
    if ((import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  /**
   * Development-Only Warning Logging
   * 
   * Logs warning messages that indicate potential issues but don't break functionality.
   * Like info logs, these are filtered out in production to maintain clean console output.
   * 
   * **Use Cases:**
   * - Performance degradation warnings
   * - Deprecated API usage
   * - Non-critical configuration issues
   * - Resource usage alerts
   * 
   * @param args - Any number of arguments to log (same as console.warn)
   * @example
   * ```typescript
   * logger.warn('API response time exceeded 2s:', responseTime);
   * logger.warn('Using fallback authentication method');
   * logger.warn('Queue size approaching limit:', queueLength);
   * ```
   */
  warn: (...args: any[]) => {
    // Development environment check for warning messages
    if ((import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },

  /**
   * Production-Safe Error Logging
   * 
   * Logs error messages that should always be visible regardless of environment.
   * These critical errors help with production debugging and monitoring.
   * 
   * **Important:** These messages are visible in production, so avoid including
   * sensitive information like user credentials, API keys, or internal system details.
   * 
   * **Use Cases:**
   * - Database connection failures
   * - API request failures
   * - Authentication errors
   * - Critical business logic failures
   * 
   * @param args - Any number of arguments to log (same as console.error)
   * @example
   * ```typescript
   * logger.error('Database connection failed:', error.message);
   * logger.error('Unable to assign taxi:', { queueId, seater });
   * logger.error('Authentication service unavailable');
   * ```
   */
  error: (...args: any[]) => {
    // Always log errors regardless of environment for production debugging
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};

