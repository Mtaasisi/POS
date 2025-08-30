// Network utility functions for handling API errors and retries

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface NetworkError {
  code?: string;
  message: string;
  isRetryable: boolean;
}

export const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Determines if an error is retryable based on error type and status code
 */
export function isRetryableError(error: any): boolean {
  // Network errors that should be retried
  const networkErrors = [
    'QUIC_PROTOCOL_ERROR',
    'net::ERR_QUIC_PROTOCOL_ERROR',
    'Failed to fetch',
    'NetworkError',
    'NETWORK_ERROR',
    'Service Unavailable',
    'Gateway Timeout',
    'Internal Server Error'
  ];
  
  // Check if error message contains any retryable error patterns
  const errorMessage = error.message || error.toString();
  const hasNetworkError = networkErrors.some(pattern => 
    errorMessage.includes(pattern)
  );
  
  // Check status codes
  const statusCode = error.code || error.status;
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  const hasRetryableStatus = retryableStatusCodes.includes(statusCode);
  
  // Don't retry 400 Bad Request errors
  if (statusCode === 400) {
    return false;
  }
  
  return hasNetworkError || hasRetryableStatus;
}

/**
 * Calculates delay for exponential backoff
 */
export function calculateBackoffDelay(
  attempt: number, 
  options: RetryOptions = {}
): number {
  const { baseDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;
  
  const delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retry wrapper for async functions with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3 } = options;
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's not a retryable error or we've reached max retries
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      console.warn(`🔄 Retry attempt ${attempt}/${maxRetries} after error:`, error.message);
      
      // Calculate delay with exponential backoff
      const delay = calculateBackoffDelay(attempt, options);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const normalized = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (9-15 digits)
  return normalized.length >= 9 && normalized.length <= 15;
}

/**
 * Normalizes phone number for database queries
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Creates WhatsApp sender IDs for a phone number
 */
export function createWhatsAppSenderIds(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  
  if (!validatePhoneNumber(phone)) {
    return [];
  }
  
  // Create both formats: with and without country code
  const senderIds = [`${normalized}@c.us`];
  
  // Add with country code if it's not already there
  if (!normalized.startsWith('255')) {
    senderIds.push(`255${normalized}@c.us`);
  }
  
  return senderIds;
}

/**
 * Logs network error details for debugging
 */
export function logNetworkError(error: any, context: string = 'API call'): void {
  console.error(`❌ ${context} failed:`, {
    message: error.message,
    code: error.code,
    status: error.status,
    name: error.name,
    context,
    timestamp: new Date().toISOString()
  });
  
  // Log additional details for specific error types
  if (error.message?.includes('QUIC_PROTOCOL_ERROR')) {
    console.error('🌐 QUIC Protocol Error detected. This may be due to:');
    console.error('   - Network instability or poor connection quality');
    console.error('   - Firewall or proxy interference');
    console.error('   - Browser network stack issues');
    console.error('   - Server connectivity problems');
  }
  
  if (error.message?.includes('Service Unavailable')) {
    console.error('🔧 Service Unavailable. This may be due to:');
    console.error('   - Server overload or maintenance');
    console.error('   - Rate limiting');
    console.error('   - Temporary infrastructure issues');
  }
}
