// FRONTEND IMPLEMENTATION FOR SUPABASE QUERIES
// Use these JavaScript functions in your React/Vue/Angular frontend

// ✅ WORKING SALES LIST FUNCTION
// Use this for your main sales page
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
      updated_at,
      customers(name, phone, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
};

// ✅ WORKING SALE DETAILS FUNCTION
// Use this for SaleDetailsModal
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
    .select(`
      *,
      lats_products(name, description, sku, barcode, category_id),
      lats_product_variants(name, sku, barcode, attributes)
    `)
    .eq('sale_id', saleId);

  if (itemsError) throw itemsError;

  // Get categories for products
  const categoryIds = items
    .map(item => item.lats_products?.category_id)
    .filter(Boolean);

  const { data: categories } = await supabase
    .from('lats_categories')
    .select('*')
    .in('id', categoryIds);

  // Combine everything
  const saleWithDetails = {
    ...sale,
    sale_items: items.map(item => ({
      ...item,
      category: categories?.find(cat => cat.id === item.lats_products?.category_id)
    }))
  };

  return saleWithDetails;
};

// ✅ WORKING SALE ITEMS FUNCTION
// Use this to get sale items with full product and variant details
export const getSaleItemsWithDetails = async (saleId) => {
  const { data: items, error: itemsError } = await supabase
    .from('lats_sale_items')
    .select(`
      *,
      lats_products(name, description, sku, barcode, category_id),
      lats_product_variants(name, sku, barcode, attributes)
    `)
    .eq('sale_id', saleId);

  if (itemsError) throw itemsError;

  // Get categories
  const categoryIds = items
    .map(item => item.lats_products?.category_id)
    .filter(Boolean);

  const { data: categories } = await supabase
    .from('lats_categories')
    .select('*')
    .in('id', categoryIds);

  return items.map(item => ({
    ...item,
    category: categories?.find(cat => cat.id === item.lats_products?.category_id)
  }));
};

// ✅ WORKING CATEGORY FUNCTION
// Use this to get category details for products
export const getCategoriesForProducts = async (productIds) => {
  const { data: categories, error } = await supabase
    .from('lats_categories')
    .select('*')
    .in('id', productIds);

  if (error) throw error;
  return categories;
};

// ✅ USAGE EXAMPLES

// Example 1: Get all sales for sales list page
const loadSalesList = async () => {
  try {
    const sales = await getAllSales();
    console.log('Sales loaded:', sales);
    // Update your state/UI with sales data
  } catch (error) {
    console.error('Error loading sales:', error);
  }
};

// Example 2: Get sale details for modal
const loadSaleDetails = async (saleId) => {
  try {
    const saleDetails = await getSaleDetails(saleId);
    console.log('Sale details:', saleDetails);
    // Show sale details in modal
  } catch (error) {
    console.error('Error loading sale details:', error);
  }
};

// Example 3: Get sale items with full details
const loadSaleItems = async (saleId) => {
  try {
    const saleItems = await getSaleItemsWithDetails(saleId);
    console.log('Sale items:', saleItems);
    // Display sale items in table/list
  } catch (error) {
    console.error('Error loading sale items:', error);
  }
};

// ✅ SUPABASE CLIENT SETUP
// Make sure you have your Supabase client configured:
/*
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
*/

// ✅ ERROR HANDLING
// Always wrap your Supabase calls in try-catch blocks
// Check for errors before using the data
// Handle loading states in your UI

// ✅ PERFORMANCE TIPS
// - Use .limit() to control data size
// - Use .select() to only get needed columns
// - Cache results when possible
// - Use separate queries instead of complex nested ones
// - Handle loading states for better UX
