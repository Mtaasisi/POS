// Application configuration settings

export const APP_CONFIG = {
  // WebSocket Configuration
  websocket: {
    maxRetries: 5,
    baseDelay: 1000, // 1 second
    reconnectInterval: 5000, // 5 seconds
  },

  // Image Configuration
  images: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    // Image loading configuration
    loading: {
      timeout: 10000, // 10 seconds
      retryAttempts: 2,
      useFallbacks: true,
      blockUnreliableUrls: true,
    },
  },

  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  },

  // Real-time Configuration
  realtime: {
    enabled: true,
    stockUpdateInterval: 5000, // 5 seconds
    productUpdateInterval: 10000, // 10 seconds
    // Real-time connection settings
    connection: {
      maxRetries: 2, // Reduced from 3 to 2 to prevent excessive retries
      retryDelay: 3000, // Increased from 2 seconds to 3 seconds
      maxRetryDelay: 10000, // Reduced from 15 seconds to 10 seconds
      connectionTimeout: 5000, // 5 seconds
      cooldownPeriod: 15000, // Increased from 10 seconds to 15 seconds between connection attempts
      circuitBreakerTimeout: 60000, // 1 minute circuit breaker timeout
    },
  },

  // Audio Configuration
  audio: {
    enabled: true,
    volume: 0.5,
    sounds: {
      notification: '/sounds/notification.mp3',
      error: '/sounds/error.mp3',
      success: '/sounds/success.mp3',
    },
  },

  // Error Handling
  errors: {
    showNotifications: true,
    logToConsole: true,
    retryOnFailure: true,
  },

  // Development Configuration
  development: {
    debugMode: import.meta.env.MODE === 'development',
    mockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  },

  // HTTP Configuration
  http: {
    maxHeaderSize: 8192, // 8KB max header size to prevent 431 errors
    requestTimeout: 30000, // 30 seconds
    retryAttempts: 3,
  },
};

// Environment-specific configurations
export const getConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...APP_CONFIG,
        development: {
          ...APP_CONFIG.development,
          debugMode: false,
          logLevel: 'warn',
        },
        realtime: {
          ...APP_CONFIG.realtime,
          connection: {
            ...APP_CONFIG.realtime.connection,
            maxRetries: 2, // Fewer retries in production
          },
        },
      };
    case 'test':
      return {
        ...APP_CONFIG,
        realtime: {
          ...APP_CONFIG.realtime,
          enabled: false, // Disable real-time in tests
        },
        audio: {
          ...APP_CONFIG.audio,
          enabled: false, // Disable audio in tests
        },
      };
    default:
      return APP_CONFIG;
  }
};

export default getConfig();
