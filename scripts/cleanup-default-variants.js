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

async function cleanupDefaultVariants() {
  console.log('🧹 Cleaning up default variants...');
  
  try {
    // Find all variants with "Default Variant" name
    const { data: defaultVariants, error: fetchError } = await supabase
      .from('lats_product_variants')
      .select('id, name, sku, product_id')
      .eq('name', 'Default Variant');
    
    if (fetchError) {
      console.error('❌ Error fetching default variants:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${defaultVariants.length} variants with "Default Variant" name`);
    
    if (defaultVariants.length === 0) {
      console.log('✅ No default variants found to clean up');
      return;
    }
    
    // Group by product to see which products have default variants
    const productGroups = {};
    defaultVariants.forEach(variant => {
      if (!productGroups[variant.product_id]) {
        productGroups[variant.product_id] = [];
      }
      productGroups[variant.product_id].push(variant);
    });
    
    console.log(`📦 Found ${Object.keys(productGroups).length} products with default variants`);
    
    // For each product, update the default variant names
    for (const [productId, variants] of Object.entries(productGroups)) {
      console.log(`🔄 Processing product ${productId} with ${variants.length} default variants`);
      
      // Get product name for better naming
      const { data: product, error: productError } = await supabase
        .from('lats_products')
        .select('name')
        .eq('id', productId)
        .single();
      
      if (productError) {
        console.error(`❌ Error fetching product ${productId}:`, productError);
        continue;
      }
      
      // Update each default variant
      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        const newName = variants.length === 1 ? 'Variant 1' : `Variant ${i + 1}`;
        const newSku = variant.sku.includes('-DEFAULT') 
          ? variant.sku.replace('-DEFAULT', `-${i + 1}`)
          : variant.sku;
        
        console.log(`  📝 Updating variant ${variant.id}: "${variant.name}" → "${newName}"`);
        
        const { error: updateError } = await supabase
          .from('lats_product_variants')
          .update({
            name: newName,
            sku: newSku,
            attributes: {} // Remove any isDefault attributes
          })
          .eq('id', variant.id);
        
        if (updateError) {
          console.error(`❌ Error updating variant ${variant.id}:`, updateError);
        } else {
          console.log(`  ✅ Updated variant ${variant.id}`);
        }
      }
    }
    
    console.log('✅ Default variant cleanup completed');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanupDefaultVariants()
  .then(() => {
    console.log('🎉 Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
