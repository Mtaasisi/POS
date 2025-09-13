export const BEEM_CONFIG = {
  // API Configuration
  API_BASE_URL: typeof window !== 'undefined' ? 'https://beem.africa/api' : (process.env.NEXT_PUBLIC_BEEM_API_URL || 'https://beem.africa/api'),
  API_VERSION: 'v1',
  
  // Default Credentials (for development)
  DEFAULT_API_KEY: '6d829f20896bd90e',
  DEFAULT_SECRET_KEY: 'NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==',
  
  // Payment Methods
  SUPPORTED_CURRENCIES: ['TZS', 'KES', 'UGX', 'USD'],
  
  // Checkout Configuration
  CHECKOUT_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUTO_RETURN: true,
  
  // Webhook Configuration
  WEBHOOK_EVENTS: [
    'payment.completed',
    'payment.failed',
    'payment.cancelled',
    'payment.pending'
  ],
  
  // UI Configuration
  BRAND_COLOR: '#2563eb',
  BRAND_NAME: 'Beem Africa',
  LOGO_URL: '/icons/payment-methods/beem.svg',
  
  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Beem Africa API credentials are not configured',
    NETWORK_ERROR: 'Network error occurred while processing payment',
    TIMEOUT_ERROR: 'Payment session timed out',
    INVALID_AMOUNT: 'Invalid payment amount',
    CURRENCY_NOT_SUPPORTED: 'Currency not supported by Beem Africa'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    PAYMENT_COMPLETED: 'Payment completed successfully',
    CHECKOUT_CREATED: 'Checkout session created successfully'
  }
};

export interface BeemCredentials {
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
}

export interface BeemCheckoutOptions {
  amount: number;
  currency: string;
  reference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface BeemPaymentStatus {
  orderId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  reference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get credentials
export function getBeemCredentials(): BeemCredentials {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    return {
      apiKey: BEEM_CONFIG.DEFAULT_API_KEY,
      secretKey: BEEM_CONFIG.DEFAULT_SECRET_KEY
    };
  }
  
  // Node.js environment - only access process.env if it exists
  if (typeof process !== 'undefined' && process.env) {
    return {
      apiKey: process.env.NEXT_PUBLIC_BEEM_API_KEY || BEEM_CONFIG.DEFAULT_API_KEY,
      secretKey: process.env.NEXT_PUBLIC_BEEM_SECRET_KEY || BEEM_CONFIG.DEFAULT_SECRET_KEY
    };
  }
  
  // Fallback to default credentials
  return {
    apiKey: BEEM_CONFIG.DEFAULT_API_KEY,
    secretKey: BEEM_CONFIG.DEFAULT_SECRET_KEY
  };
}
