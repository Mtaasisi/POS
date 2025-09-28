import { supabase } from './supabaseClient';

/**
 * Utility functions for handling authentication issues
 */

/**
 * Clear all authentication data and force a fresh login
 * This is useful when encountering 403 Forbidden errors due to invalid tokens
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing authentication state...');
    
    // Clear Supabase session
    await supabase.auth.signOut();
    
    // Clear localStorage auth data
    if (typeof window !== 'undefined') {
      // Clear all auth-related localStorage items
      const authKeys = [
        'lats-app-auth-token',
        'sb-jxhzveborezjhsmzsgbc-auth-token',
        'supabase.auth.token',
        'supabase.auth.session'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Cleared localStorage key: ${key}`);
      });
      
      // Clear any other auth-related data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cleared auth-related localStorage key: ${key}`);
        }
      });
    }
    
    console.log('✅ Authentication state cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing authentication state:', error);
  }
};

/**
 * Check if the current session is valid
 */
export const isSessionValid = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      // Only log session errors in development or if they're not common auth errors
      if (process.env.NODE_ENV === 'development' && !error.message?.includes('Invalid JWT')) {
        console.error('❌ Session check error:', error);
      }
      return false;
    }
    
    if (!session) {
      // Only log in development mode and reduce frequency
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log('⚠️ No active session found');
      }
      return false;
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      // Only log expired sessions occasionally in development
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log('⚠️ Session has expired');
      }
      return false;
    }
    
    // Only log valid sessions occasionally to reduce noise
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
      console.log('✅ Session is valid');
    }
    return true;
  } catch (error) {
    console.error('❌ Error checking session validity:', error);
    return false;
  }
};

/**
 * Handle 403 Forbidden errors by clearing auth state and redirecting to login
 */
export const handle403Error = async (): Promise<void> => {
  console.log('🚨 Handling 403 Forbidden error...');
  
  // Clear authentication state
  await clearAuthState();
  
  // Show user-friendly message
  if (typeof window !== 'undefined') {
    // You can customize this message or use your toast system
    alert('Your session has expired. Please log in again.');
    
    // Optionally redirect to login page
    // window.location.href = '/login';
  }
};

/**
 * Safe wrapper for Supabase auth operations that handles 403 errors
 */
export const withAuthErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error: any) {
    console.error('❌ Auth operation failed:', error);
    
    // Check if it's a 403 error
    if (error?.status === 403 || 
        error?.message?.includes('403') ||
        error?.message?.includes('Forbidden') ||
        error?.message?.includes('bad_jwt') ||
        error?.message?.includes('missing sub claim')) {
      
      console.log('🔐 Detected 403 error, clearing auth state...');
      await handle403Error();
      
      // Try fallback operation if provided
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          console.error('❌ Fallback operation also failed:', fallbackError);
        }
      }
    }
    
    throw error;
  }
};
