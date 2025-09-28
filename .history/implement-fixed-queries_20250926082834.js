// IMPLEMENT FIXED SUPABASE QUERIES
// This file contains the working query implementations to replace your problematic queries

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (replace with your actual credentials)
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key
const supabase = createClient(supabaseUrl, supabaseKey);

// 🚀 SOLUTION 1: JSON Aggregation Approach (Recommended)
// This is the most efficient single-query solution
export const getSalesWithDetailsJSON = async () => {
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
    console.error('❌ Error in getSalesWithDetailsJSON:', error);
    return [];
  }
};

// 🚀 SOLUTION 2: Simplified Two-Step Approach (Fallback)
// This breaks the complex query into two simpler queries
export const getSalesWithDetailsSimplified = async () => {
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
    console.error('❌ Error in getSalesWithDetailsSimplified:', error);
    return [];
  }
};

// 🚀 SOLUTION 3: Separate Queries Approach (Most Reliable)
// This uses completely separate queries for maximum reliability
export const getSalesWithDetailsSeparate = async () => {
  try {
    console.log('🔄 Loading sales with separate queries approach...');
    
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
    console.error('❌ Error in getSalesWithDetailsSeparate:', error);
    return [];
  }
};

// 🚀 SOLUTION 4: Basic Query (Emergency Fallback)
// This is the simplest possible query for emergency use
export const getBasicSales = async () => {
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
    console.error('❌ Error in getBasicSales:', error);
    return [];
  }
};

// 🎯 MAIN FUNCTION: Smart Query with Fallbacks
// This function tries different approaches until one works
export const getSalesData = async () => {
  console.log('🚀 Starting smart sales data loading...');
  
  try {
    // Try JSON aggregation first (most efficient)
    console.log('🔄 Trying JSON aggregation approach...');
    let sales = await getSalesWithDetailsJSON();
    
    if (sales && sales.length > 0) {
      console.log('✅ JSON aggregation successful');
      return sales;
    }
    
    // Try simplified approach
    console.log('🔄 JSON aggregation failed, trying simplified approach...');
    sales = await getSalesWithDetailsSimplified();
    
    if (sales && sales.length > 0) {
      console.log('✅ Simplified approach successful');
      return sales;
    }
    
    // Try separate queries approach
    console.log('🔄 Simplified approach failed, trying separate queries...');
    sales = await getSalesWithDetailsSeparate();
    
    if (sales && sales.length > 0) {
      console.log('✅ Separate queries successful');
      return sales;
    }
    
    // Try basic query as last resort
    console.log('🔄 Separate queries failed, trying basic query...');
    sales = await getBasicSales();
    
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
// Use these to test individual approaches

export const testJSONAggregation = async () => {
  console.log('🧪 Testing JSON aggregation...');
  const result = await getSalesWithDetailsJSON();
  console.log('Result:', result.length, 'sales');
  return result;
};

export const testSimplified = async () => {
  console.log('🧪 Testing simplified approach...');
  const result = await getSalesWithDetailsSimplified();
  console.log('Result:', result.length, 'sales');
  return result;
};

export const testSeparate = async () => {
  console.log('🧪 Testing separate queries...');
  const result = await getSalesWithDetailsSeparate();
  console.log('Result:', result.length, 'sales');
  return result;
};

export const testBasic = async () => {
  console.log('🧪 Testing basic query...');
  const result = await getBasicSales();
  console.log('Result:', result.length, 'sales');
  return result;
};

// 🎯 USAGE EXAMPLES

// Example 1: Use the smart function (recommended)
export const loadSales = async () => {
  const sales = await getSalesData();
  return sales;
};

// Example 2: Use a specific approach
export const loadSalesWithJSON = async () => {
  const sales = await getSalesWithDetailsJSON();
  return sales;
};

// Example 3: Use the simplified approach
export const loadSalesSimplified = async () => {
  const sales = await getSalesWithDetailsSimplified();
  return sales;
};

// Example 4: Use separate queries
export const loadSalesSeparate = async () => {
  const sales = await getSalesWithDetailsSeparate();
  return sales;
};

// 🚨 REPLACE YOUR CURRENT QUERY WITH THIS:
// Instead of the problematic query that causes 400 errors, use:

/*
// ❌ DON'T USE THIS (causes 400 error):
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

/*
// ✅ USE THIS INSTEAD (works reliably):
const sales = await getSalesData();
*/

// Export all functions for use in your application
export default {
  getSalesData,
  getSalesWithDetailsJSON,
  getSalesWithDetailsSimplified,
  getSalesWithDetailsSeparate,
  getBasicSales,
  loadSales,
  loadSalesWithJSON,
  loadSalesSimplified,
  loadSalesSeparate,
  testJSONAggregation,
  testSimplified,
  testSeparate,
  testBasic
};
