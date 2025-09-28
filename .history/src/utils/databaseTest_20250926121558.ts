import { supabase } from '../lib/supabaseClient';
import { SupabaseErrorHandler, safeQuery } from './supabaseErrorHandler';

export const testDatabaseConnection = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      return { success: false, error: testError.message };
    }

    console.log('✅ Database connection successful');
    
    // Test 2: Check if lats_sales table exists and has data
    const { data: salesCount, error: countError } = await supabase
      .from('lats_sales')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting sales:', countError);
      return { success: false, error: countError.message };
    }

    console.log(`✅ Found ${salesCount?.length || 0} sales in database`);

    // Test 2.1: Get some actual sales data to see the date range
    const { data: recentSales, error: recentError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentError && recentSales && recentSales.length > 0) {
      console.log('📅 Recent sales dates:', recentSales.map(s => ({
        id: s.id,
        sale_number: s.sale_number,
        created_at: new Date(s.created_at).toLocaleDateString()
      })));
    }
    
    // Test 3: Try to fetch a specific sale (the one that's failing) - using safer query
    const failingSaleId = '36487185-0673-4e03-83c2-26eba8d9fef7';
    const { data: specificSale, error: specificError } = await supabase
      .from('lats_sales')
      .select('id, sale_number')
      .eq('id', failingSaleId)
      .limit(1)
      .maybeSingle();

    if (specificError) {
      console.error(`❌ Specific sale ${failingSaleId} not found:`, specificError);
    } else {
      console.log('✅ Specific sale found:', specificSale);
    }

    return { 
      success: true, 
      salesCount: salesCount?.length || 0,
      specificSaleFound: !specificError,
      specificSaleError: specificError?.message
    };
  } catch (error) {
    console.error('❌ Unexpected error during database test:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Auto-run test when this module is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    testDatabaseConnection();
  }, 1000);
}
