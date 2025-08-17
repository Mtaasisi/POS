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

async function fixDuplicateSkus() {
  console.log('🔍 Fixing duplicate SKUs in product variants...\n');
  
  try {
    // Get all product variants
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, sku, name, created_at')
      .order('created_at');
    
    if (variantsError) {
      console.error('❌ Error fetching variants:', variantsError);
      return;
    }
    
    console.log(`📊 Found ${variants.length} variants`);
    
    // Group variants by product
    const variantsByProduct = {};
    variants.forEach(variant => {
      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }
      variantsByProduct[variant.product_id].push(variant);
    });
    
    // Find products with duplicate SKUs
    const productsWithDuplicates = [];
    
    Object.keys(variantsByProduct).forEach(productId => {
      const productVariants = variantsByProduct[productId];
      const skus = productVariants.map(v => v.sku);
      const uniqueSkus = [...new Set(skus)];
      
      if (skus.length !== uniqueSkus.length) {
        productsWithDuplicates.push({
          productId,
          variants: productVariants,
          duplicateSkus: skus.filter((sku, index) => skus.indexOf(sku) !== index)
        });
      }
    });
    
    console.log(`📊 Found ${productsWithDuplicates.length} products with duplicate SKUs`);
    
    if (productsWithDuplicates.length === 0) {
      console.log('✅ No duplicate SKUs found!');
      return;
    }
    
    // Fix each product with duplicate SKUs
    for (const product of productsWithDuplicates) {
      console.log(`\n🔧 Fixing product ${product.productId}...`);
      console.log(`   Duplicate SKUs: ${[...new Set(product.duplicateSkus)].join(', ')}`);
      
      const productVariants = product.variants;
      const skuCounts = {};
      
      // Count occurrences of each SKU
      productVariants.forEach(variant => {
        skuCounts[variant.sku] = (skuCounts[variant.sku] || 0) + 1;
      });
      
      // Fix variants with duplicate SKUs
      for (let i = 0; i < productVariants.length; i++) {
        const variant = productVariants[i];
        
        if (skuCounts[variant.sku] > 1) {
          // This SKU is duplicated, generate a new unique one
          const baseSku = variant.sku.replace(/-VARIANT-\d+$/, '');
          let newSku = `${baseSku}-VARIANT-${i + 1}`;
          
          // Ensure the new SKU is unique
          let counter = 1;
          while (productVariants.some(v => v.sku === newSku && v.id !== variant.id)) {
            newSku = `${baseSku}-VARIANT-${i + 1}-${counter}`;
            counter++;
          }
          
          console.log(`   Updating variant ${variant.id}: ${variant.sku} → ${newSku}`);
          
          // Update the variant in the database
          const { error: updateError } = await supabase
            .from('lats_product_variants')
            .update({ sku: newSku })
            .eq('id', variant.id);
          
          if (updateError) {
            console.error(`   ❌ Error updating variant ${variant.id}:`, updateError);
          } else {
            console.log(`   ✅ Updated variant ${variant.id}`);
            // Update the local copy
            variant.sku = newSku;
            skuCounts[variant.sku] = 1;
            skuCounts[newSku] = 1;
          }
        }
      }
    }
    
    console.log('\n✅ Duplicate SKU fix completed!');
    
    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyVariants, error: verifyError } = await supabase
      .from('lats_product_variants')
      .select('product_id, sku')
      .order('product_id');
    
    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }
    
    // Check for remaining duplicates
    const verifyByProduct = {};
    verifyVariants.forEach(variant => {
      if (!verifyByProduct[variant.product_id]) {
        verifyByProduct[variant.product_id] = [];
      }
      verifyByProduct[variant.product_id].push(variant.sku);
    });
    
    const remainingDuplicates = Object.keys(verifyByProduct).filter(productId => {
      const skus = verifyByProduct[productId];
      return skus.length !== [...new Set(skus)].length;
    });
    
    if (remainingDuplicates.length === 0) {
      console.log('✅ No remaining duplicate SKUs found!');
    } else {
      console.log(`⚠️ Found ${remainingDuplicates.length} products with remaining duplicate SKUs`);
      remainingDuplicates.forEach(productId => {
        console.log(`   Product ${productId}: ${verifyByProduct[productId].join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicate SKUs:', error);
  }
}

// Run the fix
fixDuplicateSkus().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
