import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureProductVariants() {
  console.log('🔍 Checking for products without variants...');
  
  try {
    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name');
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    console.log(`📊 Found ${products.length} products`);
    
    // Get all variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('product_id');
    
    if (variantsError) {
      console.error('❌ Error fetching variants:', variantsError);
      return;
    }
    
    // Find products without variants
    const productsWithVariants = new Set(variants.map(v => v.product_id));
    const productsWithoutVariants = products.filter(p => !productsWithVariants.has(p.id));
    
    console.log(`📊 Found ${productsWithoutVariants.length} products without variants`);
    
    if (productsWithoutVariants.length === 0) {
      console.log('✅ All products already have variants!');
      return;
    }
    
    // Create default variants for products without variants
    const defaultVariants = productsWithoutVariants.map(product => ({
      product_id: product.id,
      sku: `${product.name.replace(/\s+/g, '').toUpperCase()}-DEFAULT`,
      name: 'Default Variant',
      attributes: {},
      cost_price: 0,
      selling_price: 0,
      quantity: 0,
      min_quantity: 0,
      max_quantity: 100
    }));
    
    console.log('🔧 Creating default variants...');
    
    const { data: newVariants, error: insertError } = await supabase
      .from('lats_product_variants')
      .insert(defaultVariants)
      .select();
    
    if (insertError) {
      console.error('❌ Error creating default variants:', insertError);
      return;
    }
    
    console.log(`✅ Created ${newVariants.length} default variants`);
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: finalVariants } = await supabase
      .from('lats_product_variants')
      .select('product_id');
    
    const finalProductsWithVariants = new Set(finalVariants.map(v => v.product_id));
    const remainingProductsWithoutVariants = products.filter(p => !finalProductsWithVariants.has(p.id));
    
    if (remainingProductsWithoutVariants.length === 0) {
      console.log('✅ All products now have variants!');
    } else {
      console.log(`⚠️ ${remainingProductsWithoutVariants.length} products still don't have variants`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
ensureProductVariants()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
