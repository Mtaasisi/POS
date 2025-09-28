// FRONTEND QUERY FIX FOR SUPABASE 400 ERROR
// Replace your current complex query with these simplified approaches

// ❌ CURRENT FAILING QUERY (causes 400 error):
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

// ✅ SOLUTION 1: Simplified single query (recommended)
const { data: sales, error: salesError } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(name, phone, email)
  `)
  .order('created_at', { ascending: false })
  .limit(100);

if (salesError) {
  console.error('Sales query error:', salesError);
  return;
}

// ✅ SOLUTION 2: Separate queries approach (most reliable)
// Step 1: Get sales with basic customer info
const { data: sales, error: salesError } = await supabase
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
    customers(name, phone, email)
  `)
  .order('created_at', { ascending: false })
  .limit(100);

if (salesError) {
  console.error('Sales query error:', salesError);
  return;
}

// Step 2: Get sale items for all sales
const saleIds = sales.map(sale => sale.id);
const { data: saleItems, error: itemsError } = await supabase
  .from('lats_sale_items')
  .select('*')
  .in('sale_id', saleIds);

if (itemsError) {
  console.error('Sale items query error:', itemsError);
  return;
}

// Step 3: Get product details for sale items
const productIds = [...new Set(saleItems.map(item => item.product_id).filter(Boolean))];
const { data: products, error: productsError } = await supabase
  .from('lats_products')
  .select('id, name, description, sku, barcode, category_id, is_active')
  .in('id', productIds);

if (productsError) {
  console.error('Products query error:', productsError);
  return;
}

// Step 4: Get product variants for sale items
const variantIds = [...new Set(saleItems.map(item => item.variant_id).filter(Boolean))];
const { data: variants, error: variantsError } = await supabase
  .from('lats_product_variants')
  .select('id, product_id, name, sku, barcode, attributes')
  .in('id', variantIds);

if (variantsError) {
  console.error('Variants query error:', variantsError);
  return;
}

// Step 5: Combine the data
const salesWithItems = sales.map(sale => {
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
    sale_items: itemsWithDetails
  };
});

console.log('Combined sales data:', salesWithItems);

// ✅ SOLUTION 3: Alternative with minimal nesting (if you must use one query)
const { data: sales, error: salesError } = await supabase
  .from('lats_sales')
  .select(`
    *,
    customers(name, phone, email),
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
  .limit(100);

// Then fetch product details separately for the items
if (sales && !salesError) {
  const allSaleItems = sales.flatMap(sale => sale.lats_sale_items || []);
  const productIds = [...new Set(allSaleItems.map(item => item.product_id).filter(Boolean))];
  
  const { data: products } = await supabase
    .from('lats_products')
    .select('id, name, description, sku')
    .in('id', productIds);
  
  const variantIds = [...new Set(allSaleItems.map(item => item.variant_id).filter(Boolean))];
  const { data: variants } = await supabase
    .from('lats_product_variants')
    .select('id, name, sku, attributes')
    .in('id', variantIds);
  
  // Combine the data
  const salesWithFullDetails = sales.map(sale => ({
    ...sale,
    lats_sale_items: (sale.lats_sale_items || []).map(item => ({
      ...item,
      product: products?.find(p => p.id === item.product_id),
      variant: variants?.find(v => v.id === item.variant_id)
    }))
  }));
}

// ✅ SOLUTION 4: For specific sale details (like SaleDetailsModal)
const getSaleDetails = async (saleId) => {
  // Get sale with customer
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
    return null;
  }

  // Get sale items
  const { data: saleItems, error: itemsError } = await supabase
    .from('lats_sale_items')
    .select('*')
    .eq('sale_id', saleId);

  if (itemsError) {
    console.error('Sale items query error:', itemsError);
    return null;
  }

  // Get products and variants for items
  const productIds = saleItems.map(item => item.product_id).filter(Boolean);
  const variantIds = saleItems.map(item => item.variant_id).filter(Boolean);

  const [productsResult, variantsResult] = await Promise.all([
    supabase
      .from('lats_products')
      .select('id, name, description, sku, barcode')
      .in('id', productIds),
    supabase
      .from('lats_product_variants')
      .select('id, name, sku, attributes')
      .in('id', variantIds)
  ]);

  const products = productsResult.data || [];
  const variants = variantsResult.data || [];

  // Combine everything
  const saleWithDetails = {
    ...sale,
    sale_items: saleItems.map(item => ({
      ...item,
      product: products.find(p => p.id === item.product_id),
      variant: variants.find(v => v.id === item.variant_id)
    }))
  };

  return saleWithDetails;
};

// USAGE EXAMPLES:

// Example 1: Get all sales (for sales list page)
export const getAllSales = async () => {
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
      customers(name, phone)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

// Example 2: Get sale details (for SaleDetailsModal)
export const getSaleDetails = async (saleId) => {
  const { data: sale, error: saleError } = await supabase
    .from('lats_sales')
    .select(`
      *,
      customers(*)
    `)
    .eq('id', saleId)
    .single();

  if (saleError) throw saleError;

  const { data: items, error: itemsError } = await supabase
    .from('lats_sale_items')
    .select('*')
    .eq('sale_id', saleId);

  if (itemsError) throw itemsError;

  return {
    ...sale,
    sale_items: items
  };
};

// Example 3: Get sale items with product details
export const getSaleItemsWithDetails = async (saleId) => {
  const { data: items, error: itemsError } = await supabase
    .from('lats_sale_items')
    .select('*')
    .eq('sale_id', saleId);

  if (itemsError) throw itemsError;

  const productIds = items.map(item => item.product_id).filter(Boolean);
  const variantIds = items.map(item => item.variant_id).filter(Boolean);

  const [productsResult, variantsResult] = await Promise.all([
    supabase.from('lats_products').select('*').in('id', productIds),
    supabase.from('lats_product_variants').select('*').in('id', variantIds)
  ]);

  return items.map(item => ({
    ...item,
    product: productsResult.data?.find(p => p.id === item.product_id),
    variant: variantsResult.data?.find(v => v.id === item.variant_id)
  }));
};
