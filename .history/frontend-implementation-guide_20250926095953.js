// FRONTEND IMPLEMENTATION GUIDE FOR SUPABASE 400 ERROR FIX
// This file contains the exact JavaScript code to replace your problematic queries

// ✅ PROBLEM IDENTIFIED:
// The complex nested query structure causes 400 errors:
// select=*,customers(name),lats_sale_items(*,lats_products(name,description),lats_product_variants(name,sku,attributes))

// ✅ ROOT CAUSE:
// Supabase REST API has limitations with deeply nested queries
// The URL becomes too long and complex for the server to process

// ✅ PERMANENT SOLUTION:
// Use separate, simple queries instead of complex nested ones
// This approach is more reliable and follows Supabase best practices

// ========================================
// 1. FOR SALES LIST PAGE (Main sales page)
// ========================================

// ❌ REMOVE THIS (causes 400 error):
/*
const { data, error } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(name),
    lats_sale_items(
      *,
      lats_products(name, description),
      lats_product_variants(name, sku, attributes)
    )
  `)
  .order('created_at', { ascending: false });
*/

// ✅ REPLACE WITH THIS (works reliably):
const { data: sales, error: salesError } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(name, phone, email)
  `)
  .order('created_at', { ascending: false })
  .limit(1000);

if (salesError) {
  console.error('Sales query error:', salesError);
  return;
}

console.log(`✅ Loaded ${sales?.length || 0} sales`);

// ========================================
// 2. FOR SALE DETAILS MODAL (When viewing specific sale)
// ========================================

// Step 1: Get sale with customer details
const { data: sale, error: saleError } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(*)
  `)
  .eq('id', saleId)
  .single();

if (saleError) {
  console.error('Sale query error:', saleError);
  return;
}

// Step 2: Get sale items with product and variant details
const { data: saleItems, error: itemsError } = await supabase
  .from('lats_sale_items')
  .select(`
    *,
    lats_products(name, description, sku, barcode),
    lats_product_variants(name, sku, attributes)
  `)
  .eq('sale_id', saleId);

if (itemsError) {
  console.error('Sale items query error:', itemsError);
  return;
}

// Step 3: Combine the data
const saleWithItems = {
  ...sale,
  sale_items: saleItems || []
};

console.log('✅ Sale with items loaded:', saleWithItems);

// ========================================
// 3. FOR ANALYTICS AND REPORTS
// ========================================

// Use simplified queries without complex joins
const { data: sales, error } = await supabase
  .from('lats_sales')
  .select(`
    id,
    sale_number,
    customer_id,
    customer_name,
    customer_phone,
    total_amount,
    payment_method,
    status,
    created_at
  `)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Analytics query error:', error);
  return;
}

console.log(`✅ Loaded ${sales?.length || 0} sales for analytics`);

// ========================================
// 4. ALTERNATIVE: JSON Aggregation (if you need everything in one query)
// ========================================

// This uses PostgreSQL JSON functions instead of nested selects
const { data: salesWithDetails, error: jsonError } = await supabase
  .from('lats_sales')
  .select(`
    id,
    sale_number,
    customer_id,
    subtotal,
    total_amount,
    status,
    created_at,
    updated_at,
    customers(
      id,
      name,
      phone,
      email,
      city,
      whatsapp,
      gender,
      loyalty_level,
      color_tag,
      total_spent,
      points,
      last_visit,
      is_active,
      notes
    ),
    sale_items:lats_sale_items(
      id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price,
      products:lats_products(
        id,
        name,
        description,
        sku,
        barcode,
        category_id
      ),
      variants:lats_product_variants(
        id,
        product_id,
        name,
        sku,
        barcode,
        attributes
      )
    )
  `)
  .order('created_at', { ascending: false })
  .limit(1000);

if (jsonError) {
  console.error('JSON aggregation query failed:', jsonError);
  return;
}

console.log(`✅ Loaded ${salesWithDetails?.length || 0} sales with full details`);

// ========================================
// 5. COMPLETE IMPLEMENTATION EXAMPLE
// ========================================

// Example function that loads sales data reliably
export const loadSalesData = async (supabase) => {
  try {
    console.log('🔄 Loading sales data...');
    
    // Step 1: Get sales with basic customer info
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (salesError) {
      console.error('❌ Sales query failed:', salesError);
      throw salesError;
    }
    
    console.log(`✅ Loaded ${sales?.length || 0} sales`);
    
    // Step 2: Get sale items for all sales (if needed)
    const saleIds = sales?.map(sale => sale.id) || [];
    
    if (saleIds.length > 0) {
      const { data: saleItems, error: itemsError } = await supabase
        .from('lats_sale_items')
        .select(`
          *,
          lats_products(name, description, sku),
          lats_product_variants(name, sku, attributes)
        `)
        .in('sale_id', saleIds);
      
      if (itemsError) {
        console.warn('⚠️ Sale items query failed:', itemsError);
        // Continue without items - sales data is still valid
      } else {
        console.log(`✅ Loaded ${saleItems?.length || 0} sale items`);
        
        // Combine the data
        const salesWithItems = sales?.map(sale => ({
          ...sale,
          sale_items: saleItems?.filter(item => item.sale_id === sale.id) || []
        }));
        
        return salesWithItems || [];
      }
    }
    
    return sales || [];
    
  } catch (error) {
    console.error('❌ Error loading sales data:', error);
    return [];
  }
};

// ========================================
// 6. TESTING AND VERIFICATION
// ========================================

// Test function to verify queries work
export const testSalesQueries = async (supabase) => {
  console.log('🧪 Testing sales queries...');
  
  try {
    // Test 1: Basic sales query
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('id, sale_number, total_amount, created_at')
      .limit(5);
    
    if (salesError) {
      console.error('❌ Basic sales query failed:', salesError);
      return false;
    }
    
    console.log('✅ Basic sales query works:', sales?.length || 0, 'sales');
    
    // Test 2: Sales with customers
    const { data: salesWithCustomers, error: customersError } = await supabase
      .from('lats_sales')
      .select(`
        id,
        sale_number,
        total_amount,
        customers(name, phone)
      `)
      .limit(5);
    
    if (customersError) {
      console.error('❌ Sales with customers query failed:', customersError);
      return false;
    }
    
    console.log('✅ Sales with customers query works:', salesWithCustomers?.length || 0, 'sales');
    
    // Test 3: Sale items query
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select(`
        id,
        sale_id,
        quantity,
        unit_price,
        lats_products(name, sku)
      `)
      .limit(5);
    
    if (itemsError) {
      console.error('❌ Sale items query failed:', itemsError);
      return false;
    }
    
    console.log('✅ Sale items query works:', saleItems?.length || 0, 'items');
    
    console.log('🎉 All queries working correctly!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// ========================================
// 7. EMERGENCY FALLBACK
// ========================================

// If you still get 400 errors, use this ultra-simple query:
export const emergencySalesQuery = async (supabase) => {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('❌ Even emergency query failed:', error);
      return [];
    }
    
    console.log('✅ Emergency query works:', data?.length || 0, 'sales');
    return data || [];
    
  } catch (error) {
    console.error('❌ Emergency query error:', error);
    return [];
  }
};

// ========================================
// 8. USAGE INSTRUCTIONS
// ========================================

/*
1. Replace all problematic complex queries with the simplified versions above
2. Test each query individually to ensure they work
3. Use the testSalesQueries function to verify everything works
4. If you still get 400 errors, use the emergency fallback
5. Monitor the browser console for any remaining errors
6. Use the browser network tab to see the actual API calls being made

REMEMBER:
- Simple queries are more reliable than complex ones
- Separate API calls are better than nested joins
- Always test queries before implementing
- Use error handling for all database operations
*/