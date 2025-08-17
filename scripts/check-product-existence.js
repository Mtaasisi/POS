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

async function checkProductExistence() {
  console.log('🔍 Checking product existence and foreign key constraints...\n');
  
  const problematicProductId = '90d8d0c1-dace-4837-ac5b-f595561b7de1';
  
  try {
    // Check if the product exists in lats_products
    console.log(`📋 Checking if product ${problematicProductId} exists in lats_products...`);
    
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', problematicProductId)
      .single();
    
    if (productError) {
      if (productError.code === 'PGRST116') {
        console.log('❌ Product NOT FOUND in lats_products table');
        console.log('   This explains the foreign key constraint violation');
      } else {
        console.error('❌ Error checking product:', productError);
      }
    } else {
      console.log('✅ Product FOUND in lats_products table:');
      console.log(`   Name: ${product.name}`);
      console.log(`   Created: ${product.created_at}`);
    }
    
    // Check what products do exist
    console.log('\n📦 Checking existing products in lats_products...');
    
    const { data: allProducts, error: allProductsError } = await supabase
      .from('lats_products')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allProductsError) {
      console.error('❌ Error fetching products:', allProductsError);
    } else {
      console.log(`✅ Found ${allProducts.length} products in lats_products:`);
      allProducts.forEach((p, index) => {
        console.log(`   ${index + 1}. ${p.name} (${p.id}) - ${p.created_at}`);
      });
    }
    
    // Check if there are any variants trying to reference the problematic product
    console.log('\n🔍 Checking for variants referencing the problematic product...');
    
    const { data: problematicVariants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .eq('product_id', problematicProductId);
    
    if (variantsError) {
      console.error('❌ Error checking variants:', variantsError);
    } else {
      if (problematicVariants && problematicVariants.length > 0) {
        console.log(`⚠️  Found ${problematicVariants.length} variants trying to reference the missing product:`);
        problematicVariants.forEach((v, index) => {
          console.log(`   ${index + 1}. ${v.name} (${v.sku}) - ${v.id}`);
        });
      } else {
        console.log('✅ No variants found referencing the problematic product');
      }
    }
    
    // Check all variants to see what product_ids they reference
    console.log('\n📋 Checking all product variants and their references...');
    
    const { data: allVariants, error: allVariantsError } = await supabase
      .from('lats_product_variants')
      .select('id, name, sku, product_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allVariantsError) {
      console.error('❌ Error fetching variants:', allVariantsError);
    } else {
      console.log(`✅ Found ${allVariants.length} variants:`);
      allVariants.forEach((v, index) => {
        console.log(`   ${index + 1}. ${v.name} (${v.sku}) -> Product ID: ${v.product_id}`);
      });
    }
    
    // Check foreign key constraints
    console.log('\n🔗 Checking foreign key constraints...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_foreign_key_constraints', {
        table_name: 'lats_product_variants'
      });
    
    if (constraintsError) {
      console.log('ℹ️  Could not check constraints via RPC, checking manually...');
      
      // Try a simple query to see if the constraint exists
      const { error: testError } = await supabase
        .from('lats_product_variants')
        .select('product_id')
        .limit(1);
      
      if (testError && testError.message.includes('foreign key constraint')) {
        console.log('✅ Foreign key constraint is active');
      } else {
        console.log('ℹ️  Foreign key constraint status unclear');
      }
    } else {
      console.log('✅ Foreign key constraints:', constraints);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkProductExistence()
  .then(() => {
    console.log('\n✅ Product existence check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during check:', error);
    process.exit(1);
  });
