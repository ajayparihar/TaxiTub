// TaxiTub Module: Logger Utility
// Version: v0.1.0
// Last Updated: 2025-09-07
// Purpose: Gate verbose logs to development builds while allowing error logs in all environments.

export const logger = {
  // Verbose/info logs: development only
  log: (...args: any[]) => {
    // import.meta.env.DEV is provided by Vite (ES modules)
    if ((import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  // Warnings: treat as verbose unless you decide to always show in production
  warn: (...args: any[]) => {
    if ((import.meta as any).env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },

  // Errors: always surface
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};

