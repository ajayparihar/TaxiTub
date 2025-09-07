// TaxiTub Module: Custom Hooks
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Reusable custom hooks for common functionality

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../components/Toast";
import { useConfirmDialog } from "../components/DialogProvider";
import { API_CONFIG, ERROR_MESSAGES } from "../constants";
import { ApiResponse } from "../types";

/**
 * Generic async operation hook with loading, error states, and retry logic
 */
export interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useAsyncOperation = <T>(
  options: UseAsyncOperationOptions = {}
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { showSuccess, showError } = useToast();
  const retryCount = useRef(0);

  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    retryAttempts = API_CONFIG.RETRY_ATTEMPTS,
    retryDelay = API_CONFIG.RETRY_DELAY,
  } = options;

  const execute = useCallback(
    async <R>(
      operation: () => Promise<ApiResponse<R>>,
      successMessage?: string
    ): Promise<R | null> => {
      setLoading(true);
      setError(null);
      retryCount.current = 0;

      const attemptOperation = async (): Promise<R | null> => {
        try {
          const result = await operation();

          if (result.success && result.data) {
            setData(result.data as T);
            if (successMessage && showSuccessToast) {
              showSuccess(successMessage);
            }
            onSuccess?.(result.data);
            return result.data;
          } else {
            const errorMsg = result.message || ERROR_MESSAGES.GENERIC_ERROR;
            setError(errorMsg);
            if (showErrorToast) {
              showError(errorMsg);
            }
            onError?.(errorMsg);
            return null;
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : ERROR_MESSAGES.NETWORK_ERROR;
          
          // Retry logic
          if (retryCount.current < retryAttempts) {
            retryCount.current++;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return attemptOperation();
          }
          
          setError(errorMsg);
          if (showErrorToast) {
            showError(errorMsg);
          }
          onError?.(errorMsg);
          return null;
        }
      };

      const result = await attemptOperation();
      setLoading(false);
      return result;
    },
    [onSuccess, onError, showSuccessToast, showErrorToast, retryAttempts, retryDelay, showSuccess, showError]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    retryCount.current = 0;
  }, []);

  return { loading, error, data, execute, reset };
};

/**
 * Hook for API operations with automatic refresh
 */
export const useApiData = <T>(
  fetchFunction: () => Promise<ApiResponse<T>>,
  dependencies: any[] = [],
  autoRefresh = false,
  refreshInterval = 30000
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();
  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFunction();
      if (result.success) {
        setData(result.data || null);
      } else {
        const errorMsg = result.message || ERROR_MESSAGES.GENERIC_ERROR;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : ERROR_MESSAGES.NETWORK_ERROR;
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, showError]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    return undefined;
  }, [autoRefresh, refreshInterval, fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh };
};

/**
 * Hook for form validation with debounced validation
 */
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationFunction: (values: T) => { isValid: boolean; errors: Partial<T> },
  debounceMs = 500
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<T>>({});
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const debounceRef = useRef<NodeJS.Timeout>();

  const validateForm = useCallback(() => {
    const validation = validationFunction(values);
    setErrors(validation.errors);
    setIsValid(validation.isValid);
  }, [values, validationFunction]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      validateForm();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [values, validateForm, debounceMs]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsValid(false);
    setTouched({});
  }, [initialValues]);

  const getFieldError = useCallback((field: keyof T): string | undefined => {
    return touched[field] ? errors[field] as string : undefined;
  }, [touched, errors]);

  return {
    values,
    errors,
    isValid,
    touched,
    updateField,
    resetForm,
    getFieldError,
    setValues,
  };
};

/**
 * Hook for confirm dialogs with presets
 */
export const useConfirmAction = () => {
  const confirmDialog = useConfirmDialog();

  const confirmDelete = useCallback(
    (itemName: string) =>
      confirmDialog(
        "Delete Confirmation",
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      ),
    [confirmDialog]
  );

  const confirmAction = useCallback(
    (message: string, title = "Confirm Action") =>
      confirmDialog(title, message),
    [confirmDialog]
  );

  return { confirmDelete, confirmAction, confirmDialog };
};

/**
 * Hook for debounced search
 */
export const useDebouncedSearch = (
  initialValue = "",
  delay = 500
) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, delay]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
};
