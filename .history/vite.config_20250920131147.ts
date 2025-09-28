import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const server = {
    port: 5173,
    host: 'localhost',
    hmr: {
      port: 5173,
      host: 'localhost',
      protocol: 'ws',
      timeout: 30000, // 30 second timeout for HMR
      clientPort: 5173, // Explicitly set client port
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
    // Add better error handling for development
    strictPort: false,
    // Allow access to source files for development
    fs: {
      strict: false,
      allow: ['..']
    },
    // Add better error handling
    cors: true,
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
    // Temporarily disabled PWA plugin to fix build issues
    // ...(process.env.NODE_ENV === 'production' ? [
    //   VitePWA({
    //     registerType: 'autoUpdate',
    //     includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    //     workbox: {
    //       maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
    //       globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    //       runtimeCaching: [
    //         {
    //           urlPattern: /^https:\/\/jxhzveborezjhsmzsgbc\.supabase\.co\/.*/i,
    //           handler: 'NetworkFirst',
    //           options: {
    //             cacheName: 'supabase-cache',
    //             expiration: {
    //               maxEntries: 100,
    //               maxAgeSeconds: 60 * 60 * 24, // 24 hours
    //             },
    //           },
    //         },
    //       ],
    //     },
    //     manifest: {
    //       name: 'Clean App',
    //       short_name: 'Clean',
    //       description: 'Your app description',
    //       theme_color: '#ffffff',
    //       icons: [
    //         {
    //           src: 'pwa-192x192.svg',
    //           sizes: '192x192',
    //           type: 'image/svg+xml',
    //         },
    //         {
    //           src: 'pwa-512x512.svg',
    //           sizes: '512x512',
    //           type: 'image/svg+xml',
    //         },
    //       ],
    //     },
    //   })
    // ] : []),
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
  // Remove custom esbuild configuration to fix TypeScript generic parsing issues
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
    sourcemap: process.env.NODE_ENV === 'development',
  },
  // Development-specific configuration
  ...(command === 'serve' && {
    define: {
      __DEV__: true,
    },
    server: {
      ...server,
      sourcemapIgnoreList: false,
    },
    css: {
      devSourcemap: false,
    },
  }),
}));
