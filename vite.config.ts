// TaxiTub Module: Vite Configuration
// Version: v0.1.0
// Last Updated: 2025-09-06
// Author: AI Agent
// Changelog: Comprehensive Vite setup for React + TypeScript development with optimization

/**
 * Vite Configuration for TaxiTub Application
 * 
 * Features:
 * - React 18 with TypeScript support
 * - Hot Module Replacement (HMR) for fast development
 * - Path aliases for clean imports
 * - Optimized build with code splitting
 * - Source maps for debugging
 * - Environment variable handling
 * - Development server with network access
 * 
 * @see https://vitejs.dev/config/
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { UserConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  // Load environment variables based on current mode
  const env = loadEnv(mode, process.cwd(), '');
  
  const config: UserConfig = {
    // Set base path for GitHub Pages deployment
    base: mode === 'production' ? '/Delhi-Cabs/' : '/',
    
    // Vitest configuration for unit tests
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.{test,spec}.ts']
    },
    // ========================================
    // PLUGINS CONFIGURATION
    // ========================================
    plugins: [
      react({
        // React plugin configuration
        include: "**/*.{jsx,tsx}",           // Files to process
        fastRefresh: true,                   // Enable Fast Refresh for development
        babel: {
          // Babel configuration for additional transforms
          plugins: [
            // Add babel plugins here if needed
          ],
        },
      }),
    ],

    // ========================================
    // DEVELOPMENT SERVER CONFIGURATION
    // ========================================
    server: {
      port: 3000,                          // Development server port
      host: true,                          // Listen on all network interfaces (0.0.0.0)
      open: true,                          // Auto-open browser on server start
      strictPort: false,                   // Try other ports if 3000 is busy
      cors: true,                          // Enable CORS for API requests
      
      // Proxy configuration for API calls during development
      proxy: {
        // Example: Proxy API calls to avoid CORS issues
        // '/api': {
        //   target: 'http://localhost:8000',
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/api/, '')
        // }
      },
      
      // Watch configuration
      watch: {
        usePolling: true,                  // Use polling for file changes (better for some environments)
        interval: 100,                     // Polling interval in milliseconds
      },
    },

    // ========================================
    // BUILD CONFIGURATION
    // ========================================
    build: {
      outDir: 'dist',                      // Output directory for built files
      assetsDir: 'assets',                 // Directory for static assets within outDir
      sourcemap: command === 'build' ? false : true, // Source maps only in development
      minify: 'terser',                    // Use Terser for minification
      target: 'esnext',                    // Build target (modern browsers)
      
      // Terser minification options
      terserOptions: {
        compress: {
          drop_console: true,              // Remove console.log in production
          drop_debugger: true,             // Remove debugger statements
        },
      },
      
      // Rollup-specific options
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React core libraries
            'react-vendor': ['react', 'react-dom'],
            
            // Routing
            'router': ['react-router-dom'],
            
            // Backend services
            'supabase': ['@supabase/supabase-js'],
            
            // UI library
            'mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
            
            // Utilities
            'utils': ['date-fns', 'axios'],
          },
          
          // Asset file naming
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      
      // Chunk size warning threshold
      chunkSizeWarningLimit: 1000,         // Warn for chunks larger than 1000kb
    },

    // ========================================
    // MODULE RESOLUTION
    // ========================================
    resolve: {
      // Path aliases for cleaner imports
      alias: {
        '@': resolve(__dirname, 'src'),                    // Root src directory
        '@/components': resolve(__dirname, 'src/components'), // Component directory
        '@/pages': resolve(__dirname, 'src/pages'),         // Pages directory
        '@/services': resolve(__dirname, 'src/services'),   // Services directory
        '@/types': resolve(__dirname, 'src/types'),         // Type definitions
        '@/config': resolve(__dirname, 'src/config'),       // Configuration files
        '@/utils': resolve(__dirname, 'src/utils'),         // Utility functions
        '@/hooks': resolve(__dirname, 'src/hooks'),         // Custom React hooks
        '@/constants': resolve(__dirname, 'src/constants'), // Application constants
      },
      
      // File extensions to resolve
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },

    // ========================================
    // ENVIRONMENT VARIABLES
    // ========================================
    define: {
      // Define global constants available at build time
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '0.1.0'),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      __DEV__: JSON.stringify(command === 'serve'),
    },

    // ========================================
    // DEPENDENCY OPTIMIZATION
    // ========================================
    optimizeDeps: {
      // Pre-bundle these dependencies for faster dev server startup
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'date-fns',
        'axios',
      ],
      
      // Exclude these from optimization
      exclude: [
        // Add any dependencies that should not be pre-bundled
      ],
    },

    // ========================================
    // CSS CONFIGURATION
    // ========================================
    css: {
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCase',     // Convert CSS class names to camelCase
      },
      
      // PostCSS configuration
      postcss: {
        // Add PostCSS plugins here if needed
      },
      
      // Enable CSS source maps in development
      devSourcemap: true,
    },

    // ========================================
    // PREVIEW SERVER (for production builds)
    // ========================================
    preview: {
      port: 4173,                          // Preview server port
      host: true,                          // Listen on all network interfaces
      open: true,                          // Auto-open browser
    },

    // ========================================
    // LOGGING
    // ========================================
    logLevel: 'info',                      // Logging level: 'error' | 'warn' | 'info' | 'silent'
    clearScreen: true,                     // Clear terminal screen on startup
  };

  return config;
});
