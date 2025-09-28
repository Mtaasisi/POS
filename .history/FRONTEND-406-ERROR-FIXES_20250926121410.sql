-- FRONTEND QUERY FIXES FOR 406 NOT ACCEPTABLE ERRORS
-- These are the exact code changes needed in your frontend files

-- 1. Update testDatabaseConnection function in src/utils/databaseTest.ts
-- Replace the problematic .single() with .maybeSingle() and add .limit(1)

-- BEFORE (causes 406 error):
/*
const { data: specificSale, error: specificError } = await supabase
  .from('lats_sales')
  .select('id, sale_number')
  .eq('id', failingSaleId)
  .single();
*/

-- AFTER (safe):
/*
const { data: specificSale, error: specificError } = await supabase
  .from('lats_sales')
  .select('id, sale_number')
  .eq('id', failingSaleId)
  .limit(1)
  .maybeSingle();
*/

-- 2. Update SalesReportsPage.tsx daily closure query
-- Add .limit(1) before .maybeSingle()

-- BEFORE:
/*
const { data, error } = await supabase
  .from('daily_sales_closures')
  .select('id, date, closed_at, closed_by')
  .eq('date', today)
  .maybeSingle();
*/

-- AFTER:
/*
const { data, error } = await supabase
  .from('daily_sales_closures')
  .select('id, date, closed_at, closed_by')
  .eq('date', today)
  .limit(1)
  .maybeSingle();
*/

-- 3. General query safety improvements
-- Always use .limit(1) before .single() or .maybeSingle()
-- Use .maybeSingle() instead of .single() when the record might not exist
-- Add error handling for 406 errors specifically

-- Example safe query pattern:
/*
const { data, error } = await supabase
  .from('lats_sales')
  .select('id, sale_number, created_at')
  .eq('id', saleId)
  .limit(1)
  .maybeSingle();

if (error) {
  if (error.code === 'PGRST116') {
    console.log('No record found with that ID');
    return null;
  }
  console.error('Query error:', error);
  return null;
}
*/

-- 4. Error handling for 406 errors
-- Add specific handling for 406 Not Acceptable errors:

/*
if (error) {
  if (error.message.includes('406') || error.message.includes('Not Acceptable')) {
    console.warn('406 error - likely RLS policy issue, trying alternative query');
    // Try simpler query without joins
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, created_at')
      .eq('id', saleId)
      .limit(1)
      .maybeSingle();
    
    if (simpleError) {
      console.error('Simple query also failed:', simpleError);
      return null;
    }
    return simpleData;
  }
  console.error('Query error:', error);
  return null;
}
*/
