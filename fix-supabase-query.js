// FIX SUPABASE QUERY 400 ERROR - JavaScript Code
// This file shows how to fix the 400 error in your Supabase queries

// ❌ PROBLEMATIC QUERY (causing 400 error):
// This is what's causing the 400 error in your application
const problematicQuery = async () => {
  try {
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
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Query failed:', error);
    return null;
  }
};

// ✅ SOLUTION 1: Simplified Query (Recommended)
// This approach breaks down the complex query into simpler parts
const getSalesWithDetails = async () => {
  try {
    // Step 1: Get sales with customer info
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name, phone, email)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (salesError) throw salesError;
    
    // Step 2: Get sale items for these sales
    const saleIds = sales.map(sale => sale.id);
    
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_products(name, description),
        lats_product_variants(name, sku, attributes)
      `)
      .in('sale_id', saleIds);
    
    if (itemsError) throw itemsError;
    
    // Step 3: Combine the data
    const salesWithItems = sales.map(sale => ({
      ...sale,
      sale_items: saleItems.filter(item => item.sale_id === sale.id)
    }));
    
    return salesWithItems;
  } catch (error) {
    console.error('❌ Query failed:', error);
    return null;
  }
};

// ✅ SOLUTION 2: JSON Aggregation Query (Alternative)
// This approach uses a single query with JSON aggregation
const getSalesWithDetailsJSON = async () => {
  try {
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
        customers(name, phone, email),
        sale_items:lats_sale_items(
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          products:lats_products(name, description),
          variants:lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Query failed:', error);
    return null;
  }
};

// ✅ SOLUTION 3: Basic Query (Fallback)
// If the above solutions don't work, use this basic approach
const getBasicSales = async () => {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name)
      `)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Query failed:', error);
    return null;
  }
};

// ✅ SOLUTION 4: Separate Queries (Most Reliable)
// This approach uses completely separate queries
const getSalesSeparate = async () => {
  try {
    // Get sales
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (salesError) throw salesError;
    
    // Get customers
    const customerIds = [...new Set(sales.map(sale => sale.customer_id).filter(Boolean))];
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .in('id', customerIds);
    
    if (customersError) throw customersError;
    
    // Get sale items
    const saleIds = sales.map(sale => sale.id);
    const { data: saleItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .in('sale_id', saleIds);
    
    if (itemsError) throw itemsError;
    
    // Get products
    const productIds = [...new Set(saleItems.map(item => item.product_id).filter(Boolean))];
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) throw productsError;
    
    // Get variants
    const variantIds = [...new Set(saleItems.map(item => item.variant_id).filter(Boolean))];
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .in('id', variantIds);
    
    if (variantsError) throw variantsError;
    
    // Combine the data
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
    
    return salesWithDetails;
  } catch (error) {
    console.error('❌ Query failed:', error);
    return null;
  }
};

// 🚀 USAGE EXAMPLES:

// Example 1: Use the simplified query
const loadSales = async () => {
  console.log('Loading sales with simplified query...');
  const sales = await getSalesWithDetails();
  if (sales) {
    console.log('✅ Sales loaded successfully:', sales.length, 'sales');
    return sales;
  } else {
    console.log('❌ Failed to load sales');
    return [];
  }
};

// Example 2: Use the JSON aggregation query
const loadSalesJSON = async () => {
  console.log('Loading sales with JSON aggregation...');
  const sales = await getSalesWithDetailsJSON();
  if (sales) {
    console.log('✅ Sales loaded successfully:', sales.length, 'sales');
    return sales;
  } else {
    console.log('❌ Failed to load sales');
    return [];
  }
};

// Example 3: Use the separate queries approach
const loadSalesSeparate = async () => {
  console.log('Loading sales with separate queries...');
  const sales = await getSalesSeparate();
  if (sales) {
    console.log('✅ Sales loaded successfully:', sales.length, 'sales');
    return sales;
  } else {
    console.log('❌ Failed to load sales');
    return [];
  }
};

// Example 4: Use the basic query as fallback
const loadBasicSales = async () => {
  console.log('Loading basic sales...');
  const sales = await getBasicSales();
  if (sales) {
    console.log('✅ Basic sales loaded successfully:', sales.length, 'sales');
    return sales;
  } else {
    console.log('❌ Failed to load basic sales');
    return [];
  }
};

// 🎯 RECOMMENDED IMPLEMENTATION:
// Use this in your application to replace the problematic query
const loadSalesData = async () => {
  try {
    // Try the simplified query first
    let sales = await getSalesWithDetails();
    
    if (!sales) {
      console.log('Simplified query failed, trying JSON aggregation...');
      sales = await getSalesWithDetailsJSON();
    }
    
    if (!sales) {
      console.log('JSON aggregation failed, trying separate queries...');
      sales = await getSalesSeparate();
    }
    
    if (!sales) {
      console.log('Separate queries failed, trying basic query...');
      sales = await getBasicSales();
    }
    
    if (sales) {
      console.log('✅ Sales loaded successfully:', sales.length, 'sales');
      return sales;
    } else {
      console.log('❌ All query methods failed');
      return [];
    }
  } catch (error) {
    console.error('❌ Error loading sales:', error);
    return [];
  }
};

// Export the functions for use in your application
export {
  getSalesWithDetails,
  getSalesWithDetailsJSON,
  getSalesSeparate,
  getBasicSales,
  loadSalesData
};

// 🎉 SUMMARY:
// 1. The 400 error is caused by the complex nested query structure
// 2. Use the simplified query approach (Solution 1) for best results
// 3. Use the separate queries approach (Solution 4) for maximum reliability
// 4. Always include error handling and fallback options
// 5. Test each solution to see which works best with your data
