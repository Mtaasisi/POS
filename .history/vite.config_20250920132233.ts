import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const server = {
    port: 5173,
    host: 'localhost',
    strictPort: true, // Don't try other ports if 5173 is busy
    hmr: {
      port: 5174, // Use different port for HMR WebSocket
      host: 'localhost',
      protocol: 'ws',
      timeout: 30000, // 30 second timeout for HMR
      clientPort: 5174, // Match the HMR port
      overlay: false, // Disable error overlay to prevent WebSocket issues
      // Add WebSocket configuration for better reliability
      ws: {
        host: 'localhost',
        port: 5174,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/dist/**'], // Ignore unnecessary files
    },
    // Add better error handling for development
    // Allow access to source files for development
    fs: {
      strict: false,
      allow: ['..']
    },
    // Add better error handling
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'apikey', 'X-Client-Info'],
      credentials: false,
    },
    // Add request timeout
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
    },
    // Add better error handling for development
    middlewareMode: false,
    // Increase header size limit to prevent 431 errors
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info',
    },
  };

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic'
      }),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
      // Add timeout for dependency optimization
      force: false,
      // Include TypeScript files in dependency optimization
      include: ['react', 'react-dom', 'react-router-dom'],
      // Add esbuild options for better dependency handling
      esbuildOptions: {
        target: 'es2020',
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: process.env.NODE_ENV === 'development' ? 'inline' : false,
      chunkSizeWarningLimit: 2000, // Increased for better chunking
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react', 'react-hot-toast'],
            charts: ['recharts'],
            utils: ['dayjs', 'uuid', 'papaparse', 'xlsx'],
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
            routing: ['react-router-dom'],
            pdf: ['jspdf'],
            qr: ['html5-qrcode', 'qrcode.react'],
          },
        },
      },
      // Optimize for production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    server,
    // Ensure config.js is copied to build output
    publicDir: 'public',
    // Add resolve configuration
    resolve: {
      alias: {
        '@': '/src',
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    // Add define to prevent issues with module resolution
    define: {
      __DEV__: process.env.NODE_ENV === 'development',
    },
    // Add better error handling for development
    clearScreen: false,
    logLevel: 'info',
    // Add esbuild configuration for better performance
    esbuild: {
      target: 'es2020',
      supported: {
        'bigint': true
      },
      legalComments: 'none',
      charset: 'utf8',
      sourcemap: false, // Disable source maps to avoid CORS issues
    },
    // Development-specific configuration
    ...(command === 'serve' && {
      define: {
        __DEV__: true,
      },
      server: {
        ...server,
        sourcemapIgnoreList: false,
        // Add WebSocket fallback configuration
        hmr: {
          ...server.hmr,
          overlay: false,
          // Use different port for HMR WebSocket
          clientPort: 5174,
        },
      },
      css: {
        devSourcemap: false,
      },
      build: {
        sourcemap: false,
      },
    }),
  };
});