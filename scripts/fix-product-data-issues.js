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

async function fixProductDataIssues() {
  console.log('🔧 Fixing product data quality issues...\n');
  
  try {
    const productId = 'd0c2e658-7d64-40ee-acbb-70d094e0a9b6';
    const variantId = '5139b49e-c558-4b21-8d4f-a3e9f6115fe0'; // The problematic variant
    
    console.log(`📋 Fixing product: ${productId}`);
    console.log(`🔄 Fixing variant: ${variantId}`);
    
    // Define the fixes
    const fixes = {
      name: 'Default Variant 2', // Fix the typo in the name
      selling_price: 444.44, // Fix the unusually high price (assuming it should be 444.44)
      cost_price: 200.00, // Set a reasonable cost price
      min_quantity: 5, // Keep the existing min quantity
      max_quantity: 1000 // Increase max quantity to be more reasonable
    };
    
    console.log('\n🔧 Applying fixes:');
    console.log(`   Name: "Default Vargeggggggg" → "${fixes.name}"`);
    console.log(`   Price: 444444 → ${fixes.selling_price}`);
    console.log(`   Cost: 0 → ${fixes.cost_price}`);
    console.log(`   Max Stock: 100 → ${fixes.max_quantity}`);
    
    // Apply the fixes
    const { data: updatedVariant, error: updateError } = await supabase
      .from('lats_product_variants')
      .update(fixes)
      .eq('id', variantId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating variant:', updateError);
      return;
    }
    
    console.log('\n✅ Variant updated successfully!');
    console.log('\n📊 Updated variant details:');
    console.log(`   Name: ${updatedVariant.name}`);
    console.log(`   SKU: ${updatedVariant.sku}`);
    console.log(`   Price: ${updatedVariant.selling_price}`);
    console.log(`   Cost: ${updatedVariant.cost_price}`);
    console.log(`   Stock: ${updatedVariant.quantity}`);
    console.log(`   Min Stock: ${updatedVariant.min_quantity}`);
    console.log(`   Max Stock: ${updatedVariant.max_quantity}`);
    
    // Verify the fix by fetching the product again
    console.log('\n🔍 Verifying the fix...');
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select(`
        name,
        lats_product_variants(*)
      `)
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.error('❌ Error verifying fix:', productError);
      return;
    }
    
    console.log('\n📦 Final product state:');
    console.log(`   Product: ${product.name}`);
    console.log(`   Variants: ${product.lats_product_variants.length}`);
    
    product.lats_product_variants.forEach((variant, index) => {
      console.log(`   ${index + 1}. ${variant.name}`);
      console.log(`      SKU: ${variant.sku}`);
      console.log(`      Price: ${variant.selling_price}`);
      console.log(`      Cost: ${variant.cost_price}`);
      console.log(`      Stock: ${variant.quantity}`);
    });
    
    // Check for any remaining issues
    const highPrices = product.lats_product_variants.filter(v => v.selling_price > 10000);
    if (highPrices.length > 0) {
      console.log('\n⚠️ Still found high prices:');
      highPrices.forEach(variant => {
        console.log(`   ${variant.name}: ${variant.selling_price}`);
      });
    } else {
      console.log('\n✅ No more unusually high prices found');
    }
    
    const zeroCostHighPrice = product.lats_product_variants.filter(v => 
      v.cost_price === 0 && v.selling_price > 100
    );
    if (zeroCostHighPrice.length > 0) {
      console.log('\n⚠️ Found variants with zero cost but high price:');
      zeroCostHighPrice.forEach(variant => {
        console.log(`   ${variant.name}: Cost ${variant.cost_price}, Price ${variant.selling_price}`);
      });
    } else {
      console.log('\n✅ No more zero-cost high-price variants found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing product data:', error);
  }
}

// Run the fix
fixProductDataIssues().then(() => {
  console.log('\n🏁 Fix completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Fix failed:', error);
  process.exit(1);
});
