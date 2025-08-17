import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductDelete() {
  console.log('🔍 Debugging product deletion issue...');
  
  try {
    // Get the specific product ID from the error
    const productId = '2ca19651-6ad0-468f-9087-1890cc4cc17b';
    
    console.log(`\n📋 Checking product: ${productId}`);
    
    // Check if the product exists
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.log('❌ Product not found:', productError.message);
      return;
    }
    
    console.log('✅ Product found:', product.name);
    
    // Check for variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', productId);
    
    if (variantsError) {
      console.log('❌ Error checking variants:', variantsError.message);
    } else {
      console.log(`📦 Variants found: ${variants?.length || 0}`);
      if (variants && variants.length > 0) {
        variants.forEach((variant, index) => {
          console.log(`   ${index + 1}. ${variant.name} (${variant.sku})`);
        });
      }
    }
    
    // Check for stock movements
    const { data: stockMovements, error: stockError } = await supabase
      .from('lats_stock_movements')
      .select('*')
      .eq('product_id', productId);
    
    if (stockError) {
      console.log('❌ Error checking stock movements:', stockError.message);
    } else {
      console.log(`📊 Stock movements found: ${stockMovements?.length || 0}`);
      if (stockMovements && stockMovements.length > 0) {
        stockMovements.forEach((movement, index) => {
          console.log(`   ${index + 1}. ${movement.type} - ${movement.quantity} (${movement.reason})`);
        });
      }
    }
    
    // Try to delete the product manually to see the exact error
    console.log('\n🗑️ Attempting to delete product...');
    const { error: deleteError } = await supabase
      .from('lats_products')
      .delete()
      .eq('id', productId);
    
    if (deleteError) {
      console.log('❌ Delete error:', deleteError);
      console.log('❌ Error details:', deleteError.details);
      console.log('❌ Error hint:', deleteError.hint);
      console.log('❌ Error message:', deleteError.message);
    } else {
      console.log('✅ Product deleted successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error debugging product delete:', error);
  }
}

debugProductDelete();
