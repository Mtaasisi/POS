import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLats400Error() {
  console.log('🔍 Debugging LATS 400/409 Errors...\n');

  try {
    // 1. Test product creation with minimal data
    console.log('🧪 1. Testing product creation...');
    
    const testProduct = {
      name: 'Test Product Debug',
      description: 'Test product for debugging',
      is_active: true
    };
    
    console.log('   📦 Test product data:', testProduct);
    
    const { data: newProduct, error: productError } = await supabase
      .from('lats_products')
      .insert(testProduct)
      .select()
      .single();
    
    if (productError) {
      console.log(`   ❌ Product creation failed: ${productError.message}`);
      console.log(`   📋 Error code: ${productError.code}`);
      console.log(`   📋 Error details:`, productError);
    } else {
      console.log(`   ✅ Product created successfully: ${newProduct.id}`);
      
      // Test variant creation
      const testVariant = {
        product_id: newProduct.id,
        sku: `TEST-SKU-${Date.now()}`,
        name: 'Test Variant',
        cost_price: 10.00,
        selling_price: 15.00,
        quantity: 5
      };
      
      console.log('   📦 Test variant data:', testVariant);
      
      const { data: newVariant, error: variantError } = await supabase
        .from('lats_product_variants')
        .insert(testVariant)
        .select()
        .single();
      
      if (variantError) {
        console.log(`   ❌ Variant creation failed: ${variantError.message}`);
        console.log(`   📋 Error code: ${variantError.code}`);
        console.log(`   📋 Error details:`, variantError);
      } else {
        console.log(`   ✅ Variant created successfully: ${newVariant.id}`);
        
        // Clean up test data
        await supabase.from('lats_product_variants').delete().eq('id', newVariant.id);
        await supabase.from('lats_products').delete().eq('id', newProduct.id);
        console.log('   🧹 Test data cleaned up');
      }
    }

    // 2. Check for duplicate SKUs
    console.log('\n🔍 2. Checking for duplicate SKUs...');
    
    const { data: skus, error: skuError } = await supabase
      .from('lats_product_variants')
      .select('sku, name, product_id')
      .order('sku');
    
    if (skuError) {
      console.log(`   ❌ Could not check SKUs: ${skuError.message}`);
    } else if (skus) {
      const skuCounts = {};
      skus.forEach(variant => {
        skuCounts[variant.sku] = (skuCounts[variant.sku] || 0) + 1;
      });
      
      const duplicates = Object.entries(skuCounts).filter(([sku, count]) => count > 1);
      
      if (duplicates.length > 0) {
        console.log('   ⚠️ Duplicate SKUs found:');
        duplicates.forEach(([sku, count]) => {
          console.log(`      - ${sku}: ${count} occurrences`);
        });
      } else {
        console.log('   ✅ No duplicate SKUs found');
      }
    }

    // 3. Check current data counts
    console.log('\n📊 3. Current data counts...');
    
    const tables = ['lats_products', 'lats_product_variants', 'lats_categories', 'lats_brands', 'lats_suppliers'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: ${data?.length || 0} records`);
        }
      } catch (err) {
        console.log(`   ❌ ${table}: Error getting count`);
      }
    }

    // 4. Test the specific error scenario
    console.log('\n🧪 4. Testing specific error scenario...');
    
    // Try to create a product with a variant that might cause the 400 error
    const problematicProduct = {
      name: 'Problematic Product',
      description: 'Testing 400 error',
      is_active: true
    };
    
    const { data: product, error: productError2 } = await supabase
      .from('lats_products')
      .insert(problematicProduct)
      .select()
      .single();
    
    if (productError2) {
      console.log(`   ❌ Product creation failed: ${productError2.message}`);
    } else {
      console.log(`   ✅ Product created: ${product.id}`);
      
      // Try to create a variant with the columns from the error
      const problematicVariant = {
        product_id: product.id,
        sku: 'PROBLEM-SKU-001',
        name: 'Problem Variant',
        attributes: {},
        cost_price: 0,
        selling_price: 0,
        quantity: 0,
        min_quantity: 0,
        max_quantity: null,
        barcode: null,
        weight: null,
        dimensions: null
      };
      
      console.log('   📦 Problematic variant data:', problematicVariant);
      
      const { data: variant, error: variantError2 } = await supabase
        .from('lats_product_variants')
        .insert(problematicVariant)
        .select()
        .single();
      
      if (variantError2) {
        console.log(`   ❌ Variant creation failed: ${variantError2.message}`);
        console.log(`   📋 Error code: ${variantError2.code}`);
        console.log(`   📋 Full error:`, variantError2);
      } else {
        console.log(`   ✅ Variant created: ${variant.id}`);
        
        // Clean up
        await supabase.from('lats_product_variants').delete().eq('id', variant.id);
        await supabase.from('lats_products').delete().eq('id', product.id);
      }
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

debugLats400Error();
