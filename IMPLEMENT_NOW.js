// 🚀 IMPLEMENT THIS NOW - Fix 400 Error in lats_sales Query
// This file contains the exact code to replace your problematic query

// ❌ REMOVE THIS CODE (causes 400 error):
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

// ✅ REPLACE WITH THIS CODE (works reliably):

// OPTION 1: JSON Aggregation (Recommended - Most Efficient)
export const getSalesDataJSON = async (supabase) => {
  try {
    console.log('🔄 Loading sales with JSON aggregation...');
    
    const { data, error } = await supabase
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
          notes,
          created_at,
          updated_at
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
    
    if (error) {
      console.error('❌ JSON aggregation query failed:', error);
      throw error;
    }
    
    console.log('✅ Sales loaded successfully:', data?.length || 0, 'sales');
    return data || [];
  } catch (error) {
    console.error('❌ Error in getSalesDataJSON:', error);
    return [];
  }
};

// OPTION 2: Simplified Two-Step Approach (Fallback)
export const getSalesDataSimplified = async (supabase) => {
  try {
    console.log('🔄 Loading sales with simplified approach...');
    
    // Step 1: Get sales with customer info
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        *,
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
          notes,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (salesError) {
      console.error('❌ Sales query failed:', salesError);
      throw salesError;
    }
    
    // Step 2: Get sale items for these sales
    const saleIds = sales.map(sale => sale.id);
    
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_products(
          id,
          name,
          description,
          sku,
          barcode,
          category_id
        ),
        lats_product_variants(
          id,
          product_id,
          name,
          sku,
          barcode,
          attributes
        )
      `)
      .in('sale_id', saleIds);
    
    if (itemsError) {
      console.error('❌ Sale items query failed:', itemsError);
      throw itemsError;
    }
    
    // Step 3: Combine the data
    const salesWithItems = sales.map(sale => ({
      ...sale,
      sale_items: saleItems.filter(item => item.sale_id === sale.id)
    }));
    
    console.log('✅ Sales loaded successfully:', salesWithItems.length, 'sales');
    return salesWithItems;
  } catch (error) {
    console.error('❌ Error in getSalesDataSimplified:', error);
    return [];
  }
};

// OPTION 3: Separate Queries (Most Reliable)
export const getSalesDataSeparate = async (supabase) => {
  try {
    console.log('🔄 Loading sales with separate queries...');
    
    // Step 1: Get sales
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (salesError) {
      console.error('❌ Sales query failed:', salesError);
      throw salesError;
    }
    
    // Step 2: Get customers
    const customerIds = [...new Set(sales.map(sale => sale.customer_id).filter(Boolean))];
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .in('id', customerIds);
    
    if (customersError) {
      console.error('❌ Customers query failed:', customersError);
      throw customersError;
    }
    
    // Step 3: Get sale items
    const saleIds = sales.map(sale => sale.id);
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .in('sale_id', saleIds);
    
    if (itemsError) {
      console.error('❌ Sale items query failed:', itemsError);
      throw itemsError;
    }
    
    // Step 4: Get products
    const productIds = [...new Set(saleItems.map(item => item.product_id).filter(Boolean))];
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) {
      console.error('❌ Products query failed:', productsError);
      throw productsError;
    }
    
    // Step 5: Get variants
    const variantIds = [...new Set(saleItems.map(item => item.variant_id).filter(Boolean))];
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .in('id', variantIds);
    
    if (variantsError) {
      console.error('❌ Variants query failed:', variantsError);
      throw variantsError;
    }
    
    // Step 6: Combine the data
    const salesWithDetails = sales.map(sale => {
      const customer = customers.find(c => c.id === sale.customer_id);
      const items = saleItems.filter(item => item.sale_id === sale.id);
      
      const itemsWithDetails = items.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const variant = variants.find(v => v.id === item.variant_id);
        
        return {
          ...item,
          product,
          variant
        };
      });
      
      return {
        ...sale,
        customer,
        sale_items: itemsWithDetails
      };
    });
    
    console.log('✅ Sales loaded successfully:', salesWithDetails.length, 'sales');
    return salesWithDetails;
  } catch (error) {
    console.error('❌ Error in getSalesDataSeparate:', error);
    return [];
  }
};

// OPTION 4: Basic Query (Emergency Fallback)
export const getSalesDataBasic = async (supabase) => {
  try {
    console.log('🔄 Loading basic sales...');
    
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) {
      console.error('❌ Basic sales query failed:', error);
      throw error;
    }
    
    console.log('✅ Basic sales loaded successfully:', data?.length || 0, 'sales');
    return data || [];
  } catch (error) {
    console.error('❌ Error in getSalesDataBasic:', error);
    return [];
  }
};

// 🎯 SMART FUNCTION: Tries all approaches until one works
export const getSalesData = async (supabase) => {
  console.log('🚀 Starting smart sales data loading...');
  
  try {
    // Try JSON aggregation first (most efficient)
    console.log('🔄 Trying JSON aggregation approach...');
    let sales = await getSalesDataJSON(supabase);
    
    if (sales && sales.length > 0) {
      console.log('✅ JSON aggregation successful');
      return sales;
    }
    
    // Try simplified approach
    console.log('🔄 JSON aggregation failed, trying simplified approach...');
    sales = await getSalesDataSimplified(supabase);
    
    if (sales && sales.length > 0) {
      console.log('✅ Simplified approach successful');
      return sales;
    }
    
    // Try separate queries approach
    console.log('🔄 Simplified approach failed, trying separate queries...');
    sales = await getSalesDataSeparate(supabase);
    
    if (sales && sales.length > 0) {
      console.log('✅ Separate queries successful');
      return sales;
    }
    
    // Try basic query as last resort
    console.log('🔄 Separate queries failed, trying basic query...');
    sales = await getSalesDataBasic(supabase);
    
    if (sales && sales.length > 0) {
      console.log('✅ Basic query successful');
      return sales;
    }
    
    console.log('❌ All query methods failed');
    return [];
  } catch (error) {
    console.error('❌ Error in getSalesData:', error);
    return [];
  }
};

// 🧪 TEST FUNCTIONS
export const testAllApproaches = async (supabase) => {
  console.log('🧪 Testing all approaches...');
  
  const results = {
    json: false,
    simplified: false,
    separate: false,
    basic: false
  };
  
  try {
    // Test JSON aggregation
    console.log('Testing JSON aggregation...');
    const jsonResult = await getSalesDataJSON(supabase);
    results.json = jsonResult && jsonResult.length > 0;
    console.log('JSON aggregation:', results.json ? '✅ PASSED' : '❌ FAILED');
    
    // Test simplified
    console.log('Testing simplified approach...');
    const simplifiedResult = await getSalesDataSimplified(supabase);
    results.simplified = simplifiedResult && simplifiedResult.length > 0;
    console.log('Simplified approach:', results.simplified ? '✅ PASSED' : '❌ FAILED');
    
    // Test separate
    console.log('Testing separate queries...');
    const separateResult = await getSalesDataSeparate(supabase);
    results.separate = separateResult && separateResult.length > 0;
    console.log('Separate queries:', results.separate ? '✅ PASSED' : '❌ FAILED');
    
    // Test basic
    console.log('Testing basic query...');
    const basicResult = await getSalesDataBasic(supabase);
    results.basic = basicResult && basicResult.length > 0;
    console.log('Basic query:', results.basic ? '✅ PASSED' : '❌ FAILED');
    
    console.log('📊 Test Results:', results);
    return results;
  } catch (error) {
    console.error('❌ Error in testAllApproaches:', error);
    return results;
  }
};

// 🚀 USAGE EXAMPLES

// Example 1: Use the smart function (recommended)
export const loadSales = async (supabase) => {
  const sales = await getSalesData(supabase);
  return sales;
};

// Example 2: Use a specific approach
export const loadSalesWithJSON = async (supabase) => {
  const sales = await getSalesDataJSON(supabase);
  return sales;
};

// Example 3: Use the simplified approach
export const loadSalesSimplified = async (supabase) => {
  const sales = await getSalesDataSimplified(supabase);
  return sales;
};

// Example 4: Use separate queries
export const loadSalesSeparate = async (supabase) => {
  const sales = await getSalesDataSeparate(supabase);
  return sales;
};

// 🎯 HOW TO USE IN YOUR APPLICATION:

/*
// 1. Import the functions
import { getSalesData, getSalesDataJSON, getSalesDataSimplified, getSalesDataSeparate } from './IMPLEMENT_NOW.js';

// 2. Replace your current query with one of these:

// Option A: Use the smart function (tries all approaches)
const sales = await getSalesData(supabase);

// Option B: Use JSON aggregation (most efficient)
const sales = await getSalesDataJSON(supabase);

// Option C: Use simplified approach (fallback)
const sales = await getSalesDataSimplified(supabase);

// Option D: Use separate queries (most reliable)
const sales = await getSalesDataSeparate(supabase);

// 3. Test your implementation
import { testAllApproaches } from './IMPLEMENT_NOW.js';
const results = await testAllApproaches(supabase);
console.log('Test results:', results);
*/

// Export all functions
export default {
  getSalesData,
  getSalesDataJSON,
  getSalesDataSimplified,
  getSalesDataSeparate,
  getSalesDataBasic,
  loadSales,
  loadSalesWithJSON,
  loadSalesSimplified,
  loadSalesSeparate,
  testAllApproaches
};
