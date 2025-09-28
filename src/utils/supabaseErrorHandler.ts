import { PostgrestError } from '@supabase/supabase-js';

export interface SafeQueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
  success: boolean;
}

/**
 * Handles 406 Not Acceptable errors and other common Supabase query issues
 * Provides fallback strategies for failed queries
 */
export class SupabaseErrorHandler {
  /**
   * Execute a query with automatic 406 error handling and fallback strategies
   */
  static async executeSafeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    fallbackQueryFn?: () => Promise<{ data: T | null; error: PostgrestError | null }>
  ): Promise<SafeQueryResult<T>> {
    try {
      const result = await queryFn();
      
      if (result.error) {
        // Handle 406 Not Acceptable errors
        if (result.error.message.includes('406') || result.error.message.includes('Not Acceptable')) {
          console.warn('406 error detected, trying fallback query...');
          
          if (fallbackQueryFn) {
            const fallbackResult = await fallbackQueryFn();
            if (!fallbackResult.error) {
              console.log('✅ Fallback query successful');
              return {
                data: fallbackResult.data,
                error: null,
                success: true
              };
            }
          }
          
          console.error('❌ Both primary and fallback queries failed');
          return {
            data: null,
            error: result.error,
            success: false
          };
        }
        
        // Handle other errors
        console.error('Query error:', result.error);
        return {
          data: null,
          error: result.error,
          success: false
        };
      }
      
      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      console.error('Unexpected error in executeSafeQuery:', error);
      return {
        data: null,
        error: error as PostgrestError,
        success: false
      };
    }
  }

  /**
   * Create a safe query for fetching a single record
   * Automatically handles .single() vs .maybeSingle() issues
   */
  static createSafeSingleQuery<T>(
    baseQuery: any,
    useMaybeSingle: boolean = true
  ) {
    return baseQuery.limit(1)[useMaybeSingle ? 'maybeSingle' : 'single']();
  }

  /**
   * Create a fallback query for lats_sales table
   * Uses minimal fields to avoid RLS policy issues
   */
  static createLatsSalesFallbackQuery(supabase: any, saleId: string) {
    return supabase
      .from('lats_sales')
      .select('id, sale_number, created_at')
      .eq('id', saleId)
      .limit(1)
      .maybeSingle();
  }

  /**
   * Create a fallback query for general lats_sales queries
   * Uses minimal fields to avoid complex join issues
   */
  static createLatsSalesListFallbackQuery(supabase: any, limit: number = 100) {
    return supabase
      .from('lats_sales')
      .select('id, sale_number, customer_id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  /**
   * Check if an error is a 406 Not Acceptable error
   */
  static is406Error(error: PostgrestError | null): boolean {
    if (!error) return false;
    return error.message.includes('406') || 
           error.message.includes('Not Acceptable') ||
           error.message.includes('JSON object requested, multiple (or no) rows returned');
  }

  /**
   * Get a user-friendly error message for display
   */
  static getErrorMessage(error: PostgrestError | null): string {
    if (!error) return 'Unknown error';
    
    if (this.is406Error(error)) {
      return 'Database query failed. Please try refreshing the page.';
    }
    
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      return 'Authentication error. Please log in again.';
    }
    
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return 'Database table not found. Please contact support.';
    }
    
    return `Database error: ${error.message}`;
  }
}

/**
 * Utility function for safe Supabase queries
 * Usage: const result = await safeQuery(() => supabase.from('table').select('*').eq('id', id).single());
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  fallbackQueryFn?: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<SafeQueryResult<T>> {
  return SupabaseErrorHandler.executeSafeQuery(queryFn, fallbackQueryFn);
}
