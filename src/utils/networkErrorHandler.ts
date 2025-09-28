/**
 * Enhanced Network Error Handler for QUIC Protocol and Network Issues
 * Handles ERR_QUIC_PROTOCOL_ERROR and other network-related errors
 */

export interface NetworkErrorInfo {
  error: any;
  context: string;
  retryCount?: number;
  maxRetries?: number;
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

/**
 * Determines if an error is a network error that should be retried
 */
export function isNetworkError(error: any): boolean {
  const errorMessage = error.message || error.toString();
  const errorName = error.name || '';
  const errorCode = error.code || '';

  // QUIC Protocol errors
  if (errorMessage.includes('QUIC_PROTOCOL_ERROR') || 
      errorMessage.includes('net::ERR_QUIC_PROTOCOL_ERROR')) {
    return true;
  }

  // Other network errors
  const networkErrorPatterns = [
    'Failed to fetch',
    'NetworkError',
    'NETWORK_ERROR',
    'AbortError',
    'TimeoutError',
    'Connection refused',
    'Connection reset',
    'Connection timeout',
    'Service Unavailable',
    'Gateway Timeout',
    'Internal Server Error'
  ];

  const hasNetworkError = networkErrorPatterns.some(pattern => 
    errorMessage.includes(pattern) || errorName.includes(pattern)
  );

  // Check for specific error codes
  const networkErrorCodes = ['NETWORK_ERROR', 'ABORT_ERR', 'TIMEOUT_ERR'];
  const hasNetworkErrorCode = networkErrorCodes.includes(errorCode);

  // Check for HTTP status codes that indicate network issues
  const statusCode = error.status || error.code;
  const networkStatusCodes = [408, 429, 500, 502, 503, 504];
  const hasNetworkStatusCode = networkStatusCodes.includes(statusCode);

  return hasNetworkError || hasNetworkErrorCode || hasNetworkStatusCode;
}

/**
 * Logs network error details with specific handling for QUIC errors
 */
export function logNetworkError(errorInfo: NetworkErrorInfo): void {
  const { error, context, retryCount = 0, maxRetries = 0 } = errorInfo;
  const errorMessage = error.message || error.toString();

  console.error(`❌ ${context} failed:`, {
    message: errorMessage,
    code: error.code,
    status: error.status,
    name: error.name,
    context,
    retryCount,
    maxRetries,
    timestamp: new Date().toISOString()
  });

  // Specific handling for QUIC Protocol errors
  if (errorMessage.includes('QUIC_PROTOCOL_ERROR') || 
      errorMessage.includes('net::ERR_QUIC_PROTOCOL_ERROR')) {
    console.error('🌐 QUIC Protocol Error detected. This may be due to:');
    console.error('   - Network instability or poor connection quality');
    console.error('   - Firewall or proxy interference with QUIC protocol');
    console.error('   - Browser network stack issues (try refreshing the page)');
    console.error('   - Supabase server connectivity problems');
    console.error('   - DNS resolution issues');
    console.error('   - Corporate network restrictions');
    console.error('   - Browser cache corruption (try clearing browser cache)');
    
    if (retryCount < maxRetries) {
      console.warn(`🔄 Will retry request (${retryCount + 1}/${maxRetries + 1})`);
    }
  }

  // Handle other network errors
  if (errorMessage.includes('Failed to fetch')) {
    console.error('🌐 Network fetch failed. This may be due to:');
    console.error('   - Internet connection issues');
    console.error('   - Server is down or unreachable');
    console.error('   - CORS policy restrictions');
    console.error('   - Network timeout');
  }

  if (errorMessage.includes('Service Unavailable')) {
    console.error('🔧 Service Unavailable. This may be due to:');
    console.error('   - Server overload or maintenance');
    console.error('   - Rate limiting');
    console.error('   - Temporary infrastructure issues');
  }
}

/**
 * Enhanced retry function with exponential backoff and jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Log the error
      logNetworkError({
        error,
        context: 'Network request',
        retryCount: attempt,
        maxRetries: opts.maxRetries
      });

      // Check if this is a retryable network error
      if (!isNetworkError(error) || attempt >= opts.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      const jitter = Math.random() * 1000; // Add up to 1 second of jitter
      const delay = baseDelay + jitter;

      console.warn(`🔄 Retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${opts.maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Creates a timeout promise that rejects after specified milliseconds
 */
export function createTimeoutPromise<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = 'Request timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    })
  ]);
}

/**
 * Wraps a function with timeout and retry logic
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000,
  retryOptions: Partial<RetryOptions> = {}
): Promise<T> {
  return retryWithBackoff(async () => {
    return createTimeoutPromise(fn(), timeoutMs, `Request timed out after ${timeoutMs}ms`);
  }, retryOptions);
}

/**
 * Network health check function
 */
export async function checkNetworkHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
  timestamp: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple network test using a lightweight endpoint
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const latency = Date.now() - startTime;
    
    return {
      healthy: true,
      latency,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
