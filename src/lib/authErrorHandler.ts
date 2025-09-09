import { supabase } from './supabaseClient';

/**
 * Handles authentication errors and automatically attempts to refresh the session
 * @param error - The error object from Supabase
 * @param retryFunction - Optional function to retry the original operation after refresh
 * @returns Promise<boolean> - true if session was refreshed, false otherwise
 */
export const handleSupabaseAuthError = async (
  error: any,
  retryFunction?: () => Promise<any>
): Promise<boolean> => {
  // Check if this is an authentication error
  if (error?.status === 401 || 
      error?.message?.includes('401') || 
      error?.message?.includes('Unauthorized') ||
      error?.message?.includes('JWT')) {
    
    console.log('🔐 Detected authentication error, attempting session refresh...');
    
    try {
      // Attempt to refresh the session
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('❌ Session refresh failed:', refreshError);
        return false;
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully');
        
        // If a retry function is provided, retry the original operation
        if (retryFunction) {
          try {
            await retryFunction();
            console.log('✅ Original operation retried successfully');
          } catch (retryError) {
            console.error('❌ Retry operation failed:', retryError);
          }
        }
        
        return true;
      } else {
        console.log('❌ No session after refresh');
        return false;
      }
    } catch (refreshErr) {
      console.error('❌ Error during session refresh:', refreshErr);
      return false;
    }
  }
  
  return false;
};

/**
 * Wraps a Supabase operation with automatic auth error handling
 * @param operation - The Supabase operation to execute
 * @returns Promise with the result of the operation
 */
export const withAuthErrorHandling = async <T>(
  operation: () => Promise<T>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const refreshed = await handleSupabaseAuthError(error, operation);
    if (!refreshed) {
      throw error; // Re-throw if refresh failed
    }
    // If refresh succeeded, the operation was retried, so we should have a result
    // But we need to handle the case where the retry also fails
    throw error;
  }
};

/**
 * Creates a retry wrapper for Supabase operations with auth error handling
 * @param operation - The operation to wrap
 * @param maxRetries - Maximum number of retries (default: 1)
 * @returns Wrapped operation with auth error handling
 */
export const createAuthAwareOperation = <T>(
  operation: () => Promise<T>,
  maxRetries: number = 1
) => {
  return async (): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          const refreshed = await handleSupabaseAuthError(error);
          if (!refreshed) {
            // If refresh failed, don't retry
            break;
          }
          // If refresh succeeded, continue to next attempt
        }
      }
    }
    
    throw lastError;
  };
};
