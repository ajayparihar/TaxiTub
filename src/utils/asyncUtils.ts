// TaxiTub Module: Async Operation Utilities
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Common utilities for async operations, loading states, and error handling

import { useState, useCallback } from 'react';

/**
 * Generic async operation state
 */
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing async operation state
 */
export function useAsyncState<T = any>(initialData: T | null = null): [
  AsyncState<T>,
  {
    setLoading: (loading: boolean) => void;
    setData: (data: T | null) => void;
    setError: (error: string | null) => void;
    reset: () => void;
  }
] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data, loading: false, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({ data: initialData, loading: false, error: null });
  }, [initialData]);

  return [state, { setLoading, setData, setError, reset }];
}

/**
 * Generic error message formatter
 */
export function formatErrorMessage(error: any, fallback: string = 'An unexpected error occurred'): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error_code) return `Error ${error.error_code}: ${error.message || fallback}`;
  return fallback;
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Debounce function with cleanup
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;
  
  const debouncedFunction = ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T & { cancel: () => void };
  
  debouncedFunction.cancel = () => clearTimeout(timeoutId);
  
  return debouncedFunction;
}

/**
 * Promise timeout wrapper
 */
export function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
    })
  ]);
}
