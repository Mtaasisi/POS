// WhatsApp Green API Configuration

export const WHATSAPP_CONFIG = {
  // API Configuration
  api: {
    baseUrl: 'https://api.green-api.com',
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  },

  // Webhook Configuration
  webhook: {
    url: import.meta.env.VITE_WHATSAPP_WEBHOOK_URL || '',
    secret: import.meta.env.VITE_WHATSAPP_WEBHOOK_SECRET || '',
    events: [
      'incomingMessageReceived',
      'outgoingMessageReceived',
      'outgoingAPIMessageReceived',
      'outgoingMessageStatus',
      'stateInstanceChanged',
      'statusInstanceChanged',
      'deviceInfo',
      'incomingCall'
    ] as const,
  },

  // Message Configuration
  messages: {
    maxLength: 4096, // WhatsApp text message limit
    maxFileSize: 16 * 1024 * 1024, // 16MB file size limit
    supportedTypes: [
      'text',
      'image',
      'video',
      'audio',
      'document',
      'location',
      'contact',
      'sticker',
      'poll'
    ] as const,
  },

  // Instance Configuration
  instances: {
    maxInstances: 10, // Maximum number of instances per user
    autoReconnect: true,
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 5,
  },

  // Rate Limiting
  rateLimit: {
    messagesPerMinute: 30,
    messagesPerHour: 1000,
    requestsPerMinute: 60,
  },

  // File Upload Configuration
  fileUpload: {
    maxSize: 16 * 1024 * 1024, // 16MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/3gpp',
      'audio/mp3',
      'audio/ogg',
      'audio/wav',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
  },

  // Chat Configuration
  chat: {
    maxHistoryLength: 1000, // Maximum messages to load in chat history
    autoScroll: true,
    messageTimeout: 30000, // 30 seconds timeout for message sending
  },

  // UI Configuration
  ui: {
    refreshInterval: 30000, // 30 seconds
    qrCodeSize: 256, // QR code size in pixels
    showTimestamps: true,
    showMessageStatus: true,
  },

  // Error Handling
  errors: {
    retryOnFailure: true,
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    showNotifications: true,
    logErrors: true,
  },

  // Development Configuration
  development: {
    debugMode: import.meta.env.MODE === 'development',
    mockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  },
};

// Environment-specific configurations
export const getWhatsAppConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...WHATSAPP_CONFIG,
        development: {
          ...WHATSAPP_CONFIG.development,
          debugMode: false,
          logLevel: 'warn',
        },
        rateLimit: {
          ...WHATSAPP_CONFIG.rateLimit,
          messagesPerMinute: 20, // More conservative in production
          messagesPerHour: 500,
        },
      };
    case 'staging':
      return {
        ...WHATSAPP_CONFIG,
        development: {
          ...WHATSAPP_CONFIG.development,
          debugMode: true,
          logLevel: 'info',
        },
      };
    default:
      return WHATSAPP_CONFIG;
  }
};

// Helper functions
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure it starts with country code
  if (cleaned.startsWith('255')) {
    return cleaned;
  }
  
  // Add Tanzania country code if not present
  if (cleaned.startsWith('0')) {
    return '255' + cleaned.substring(1);
  }
  
  // If it's a 9-digit number, assume it's Tanzania
  if (cleaned.length === 9) {
    return '255' + cleaned;
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone);
  // Check if it's a valid Tanzania phone number
  return /^255[0-9]{9}$/.test(formatted);
};

export const validateMessageLength = (message: string): boolean => {
  return message.length <= WHATSAPP_CONFIG.messages.maxLength;
};

export const validateFileSize = (size: number): boolean => {
  return size <= WHATSAPP_CONFIG.fileUpload.maxSize;
};

export const validateFileType = (type: string): boolean => {
  return WHATSAPP_CONFIG.fileUpload.allowedTypes.includes(type as any);
};

// Export types
export type WhatsAppEventType = typeof WHATSAPP_CONFIG.webhook.events[number];
export type WhatsAppMessageType = typeof WHATSAPP_CONFIG.messages.supportedTypes[number];
