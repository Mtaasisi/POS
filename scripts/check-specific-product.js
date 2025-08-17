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

async function checkSpecificProduct() {
  console.log('🔍 Checking specific product data...\n');
  
  try {
    // Check the specific product ID from your data
    const productId = 'd0c2e658-7d64-40ee-acbb-70d094e0a9b6';
    
    console.log(`📋 Checking product: ${productId}`);
    
    // Get the product with all its variants
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_brands(name),
        lats_suppliers(name),
        lats_product_variants(*)
      `)
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.error('❌ Error fetching product:', productError);
      return;
    }
    
    if (!product) {
      console.log('❌ Product not found');
      return;
    }
    
    console.log('\n📦 Product Details:');
    console.log(`   Name: ${product.name}`);
    console.log(`   Description: ${product.description || 'N/A'}`);
    console.log(`   Category: ${product.lats_categories?.name || 'N/A'}`);
    console.log(`   Brand: ${product.lats_brands?.name || 'N/A'}`);
    console.log(`   Created: ${product.created_at}`);
    console.log(`   Updated: ${product.updated_at}`);
    
    console.log('\n🔄 Variants:');
    if (product.lats_product_variants && product.lats_product_variants.length > 0) {
      product.lats_product_variants.forEach((variant, index) => {
        console.log(`   ${index + 1}. ${variant.name}`);
        console.log(`      ID: ${variant.id}`);
        console.log(`      SKU: ${variant.sku}`);
        console.log(`      Price: ${variant.selling_price}`);
        console.log(`      Cost: ${variant.cost_price}`);
        console.log(`      Stock: ${variant.quantity}`);
        console.log(`      Min Stock: ${variant.min_quantity}`);
        console.log(`      Max Stock: ${variant.max_quantity}`);
        console.log(`      Created: ${variant.created_at}`);
        console.log('');
      });
      
      // Check for duplicate SKUs
      const skus = product.lats_product_variants.map(v => v.sku);
      const uniqueSkus = [...new Set(skus)];
      
      if (skus.length !== uniqueSkus.length) {
        console.log('⚠️ DUPLICATE SKUs found:');
        const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
        console.log(`   Duplicate SKUs: ${[...new Set(duplicates)].join(', ')}`);
      } else {
        console.log('✅ No duplicate SKUs found');
      }
      
      // Check for unusual prices
      const highPrices = product.lats_product_variants.filter(v => v.selling_price > 100000);
      if (highPrices.length > 0) {
        console.log('⚠️ Unusually high prices found:');
        highPrices.forEach(variant => {
          console.log(`   ${variant.name}: ${variant.selling_price}`);
        });
      }
      
    } else {
      console.log('   No variants found');
    }
    
    // Also check by product name
    console.log('\n🔍 Checking by product name "ggg"...');
    const { data: productsByName, error: nameError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        lats_product_variants(id, sku, name, selling_price)
      `)
      .eq('name', 'ggg');
    
    if (nameError) {
      console.error('❌ Error fetching by name:', nameError);
    } else if (productsByName && productsByName.length > 0) {
      console.log(`📊 Found ${productsByName.length} products with name "ggg"`);
      productsByName.forEach((p, index) => {
        console.log(`   ${index + 1}. ID: ${p.id}`);
        console.log(`      Variants: ${p.lats_product_variants?.length || 0}`);
        if (p.lats_product_variants) {
          p.lats_product_variants.forEach(v => {
            console.log(`        - ${v.sku}: ${v.name} (${v.selling_price})`);
          });
        }
      });
    } else {
      console.log('   No products found with name "ggg"');
    }
    
  } catch (error) {
    console.error('❌ Error checking product:', error);
  }
}

// Run the check
checkSpecificProduct().then(() => {
  console.log('\n🏁 Check completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});
