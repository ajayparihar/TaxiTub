// TaxiTub Module: Performance Optimization Utilities
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Memoization, lazy loading, and performance improvements

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  lazy, 
  Suspense, 
  useState, 
  useEffect, 
  useRef 
} from "react";
import { Box, Typography } from "@mui/material";
import { LoadingSpinner } from "../components/Loading";

/**
 * Higher-order component for memoizing components with deep comparison
 */
export function withDeepMemo<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  customComparison?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, customComparison || ((prev, next) => {
    // Simple deep comparison for common use cases
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      const prevValue = prev[key];
      const nextValue = next[key];
      
      // Handle arrays and objects
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) return false;
        return prevValue.every((item: any, index: number) => {
          if (typeof item === "object" && item !== null) {
            return JSON.stringify(item) === JSON.stringify(nextValue[index]);
          }
          return item === nextValue[index];
        });
      }
      
      if (typeof prevValue === "object" && typeof nextValue === "object") {
        return JSON.stringify(prevValue) === JSON.stringify(nextValue);
      }
      
      return prevValue === nextValue;
    });
  }));
}

/**
 * Lazy loading wrapper with error boundary and loading state
 */
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  minLoadTime?: number; // Minimum time to show loader (prevents flash)
}

export const LazyLoadWrapper: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  error,
  minLoadTime = 300
}) => {
  const [showLoader, setShowLoader] = useState(true);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const elapsed = Date.now() - startTime.current;
    const remainingTime = Math.max(0, minLoadTime - elapsed);
    
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, remainingTime);
    
    return () => clearTimeout(timer);
  }, [minLoadTime]);

  const defaultFallback = (
    <LoadingSpinner message="Loading component..." />
  );

  const defaultError = (
    <Box sx={{ textAlign: "center", py: 4 }}>
      <Typography color="error">Failed to load component</Typography>
    </Box>
  );

  if (showLoader) {
    return <>{fallback || defaultFallback}</>;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <ErrorBoundary fallback={error || defaultError}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Simple error boundary for lazy components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Lazy component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Debounced value hook for performance optimization
 */
export const useDebouncedValue = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttled callback hook
 */
export const useThrottledCallback = <T extends any[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const lastCallTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: T) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      if (timeSinceLastCall >= delay) {
        // Call immediately if enough time has passed
        lastCallTime.current = now;
        callback(...args);
      } else {
        // Schedule the call for later
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          lastCallTime.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    },
    [callback, delay]
  );
};

/**
 * Memoized selector hook for complex computations
 */
export const useMemoizedSelector = <T, R>(
  data: T,
  selector: (data: T) => R,
  deps: React.DependencyList = []
): R => {
  return useMemo(() => {
    if (!data) return selector(data);
    return selector(data);
  }, [data, ...deps]);
};

/**
 * Virtual scrolling hook for large lists
 */
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = <T,>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, overscan = 5 } = options;

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  );

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex + 1),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    startIndex,
    endIndex,
  };
};

/**
 * Intersection observer hook for lazy loading
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting || false;
        setIsIntersecting(isVisible);
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [hasIntersected, options]);

  return { targetRef, isIntersecting, hasIntersected };
};

/**
 * Memoized component factory for frequently re-rendered components
 */
export const createMemoizedComponent = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const MemoizedComponent = memo(Component);
  
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }
  
  return MemoizedComponent;
};

/**
 * Performance monitoring hook (for development)
 */
export const usePerformanceMonitor = (
  componentName: string,
  enabled = import.meta.env.DEV
) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (renderCount.current > 1) {
      console.log(
        `[Performance] ${componentName}: Render #${renderCount.current}, ` +
        `${timeSinceLastRender.toFixed(2)}ms since last render`
      );
    }
    
    lastRenderTime.current = now;
  });

  return { renderCount: renderCount.current };
};

/**
 * Optimized event handlers factory
 */
export const createOptimizedHandlers = <T extends Record<string, any>>(
  handlers: T
): T => {
  const memoizedHandlers = {} as T;
  
  Object.entries(handlers).forEach(([key, handler]) => {
    if (typeof handler === "function") {
      memoizedHandlers[key as keyof T] = useCallback(handler, [handler]);
    } else {
      memoizedHandlers[key as keyof T] = handler;
    }
  });
  
  return memoizedHandlers;
};

/**
 * Bundle splitting utilities
 */
export const createLazyComponent = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  displayName?: string
) => {
  const LazyComponent = lazy(importFn);
  
  if (displayName) {
    // Note: displayName is not available on LazyExoticComponent at runtime
    // This is mainly for development debugging
    (LazyComponent as any).displayName = `Lazy(${displayName})`;
  }
  
  return LazyComponent;
};
