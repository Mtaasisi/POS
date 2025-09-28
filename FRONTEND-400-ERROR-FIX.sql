-- Frontend Query Fix for 400 Bad Request Error
-- Update SalesReportsPage.tsx to use correct column names

-- The problematic query in SalesReportsPage.tsx (around line 216-237):
/*
const { data: salesData, error: salesError } = await supabase
  .from('lats_sales')
  .select(`
    id,
    sale_number,
    customer_id,
    customer_name,
    customer_phone,
    total_amount,
    subtotal,
    discount_amount,
    discount_type,
    discount_value,
    tax,
    payment_method,
    status,
    created_by,
    created_at,
    lats_sale_items(
      id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price
    )
  `)
  .order('created_at', { ascending: false })
  .limit(200);
*/

-- FIXED QUERY - Use safe column names and add error handling:
/*
const fetchSales = async () => {
  try {
    setLoading(true);
    setError(null);

    // First, try a simple query to test table access
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, created_at')
      .limit(1);

    if (testError) {
      console.error('❌ Table access test failed:', testError);
      setError(`Database access error: ${testError.message}`);
      return;
    }

    console.log('✅ Table access test passed');

    // Now try the full query with safe column names
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        id,
        sale_number,
        customer_id,
        total_amount,
        payment_method,
        status,
        created_by,
        created_at,
        lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (salesError) {
      console.error('❌ Error fetching sales:', salesError);
      
      // Try fallback query without joins
      console.log('🔄 Trying fallback query without joins...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_id,
          total_amount,
          payment_method,
          status,
          created_by,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (fallbackError) {
        setError(`Failed to load sales data: ${fallbackError.message}`);
        return;
      }

      console.log(`✅ Fallback query successful: ${fallbackData?.length || 0} sales`);
      setSales(fallbackData || []);
      return;
    }

    console.log(`✅ Loaded ${salesData?.length || 0} sales with items`);
    setSales(salesData || []);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    setError('An unexpected error occurred while loading sales data');
  } finally {
    setLoading(false);
  }
};
*/

-- Alternative safe query pattern for SalesReportsPage:
/*
// Safe query with error handling and fallbacks
const safeFetchSales = async () => {
  try {
    setLoading(true);
    setError(null);

    // Step 1: Test basic table access
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error(`Table access failed: ${testError.message}`);
    }

    // Step 2: Try full query with joins
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        id,
        sale_number,
        customer_id,
        total_amount,
        payment_method,
        status,
        created_by,
        created_at,
        lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (salesError) {
      console.warn('Full query failed, trying without joins:', salesError);
      
      // Step 3: Fallback without joins
      const { data: simpleData, error: simpleError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_id,
          total_amount,
          payment_method,
          status,
          created_by,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (simpleError) {
        throw new Error(`Simple query also failed: ${simpleError.message}`);
      }

      setSales(simpleData || []);
      return;
    }

    setSales(salesData || []);

  } catch (error) {
    console.error('Sales fetch error:', error);
    setError(error instanceof Error ? error.message : 'Failed to load sales data');
  } finally {
    setLoading(false);
  }
};
*/

-- Key changes needed in SalesReportsPage.tsx:
-- 1. Remove columns that don't exist: subtotal, discount_amount, discount_type, discount_value, tax, customer_name, customer_phone
-- 2. Add proper error handling with fallback queries
-- 3. Test table access before attempting complex queries
-- 4. Use .limit(1) before .maybeSingle() calls
-- 5. Handle 400 errors specifically with fallback strategies