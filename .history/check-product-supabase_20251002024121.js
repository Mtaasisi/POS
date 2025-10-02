// Script to check if product exists in Supabase database
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

const productId = '7f9b4123-e39c-4d71-8672-2a2c069d7eb0';

async function checkProduct() {
  console.log(`🔍 Checking for product: ${productId}`);
  
  try {
    // Check if product exists in lats_products table
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.log('❌ Product not found in lats_products:', productError.message);
    } else {
      console.log('✅ Product found in lats_products:', product);
    }

    // Check product variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', productId);

    if (variantsError) {
      console.log('❌ Error fetching variants:', variantsError.message);
    } else {
      console.log(`📦 Found ${variants?.length || 0} variants:`, variants);
    }

    // Check stock movements
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (stockError) {
      console.log('❌ Error fetching stock movements:', stockError.message);
    } else {
      console.log(`📊 Found ${stockMovements?.length || 0} stock movements:`, stockMovements);
    }

    // Check inventory items
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('product_id', productId);

    if (inventoryError) {
      console.log('❌ Error fetching inventory items:', inventoryError.message);
    } else {
      console.log(`📋 Found ${inventoryItems?.length || 0} inventory items:`, inventoryItems);
    }

    // Search for similar product IDs
    const { data: similarProducts, error: similarError } = await supabase
      .from('lats_products')
      .select('id, name, is_active')
      .like('id', '%7f9b4123%');

    if (similarError) {
      console.log('❌ Error searching for similar products:', similarError.message);
    } else {
      console.log(`🔍 Found ${similarProducts?.length || 0} similar products:`, similarProducts);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkProduct();
