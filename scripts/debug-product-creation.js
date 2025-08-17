import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugProductCreation() {
  console.log('🔍 Debugging Product Creation Issue...\n');

  try {
    // Step 1: Check if lats_products table exists
    console.log('📋 Step 1: Checking if lats_products table exists...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(1);
    
    if (productsError) {
      console.log('❌ lats_products table error:', productsError.message);
      console.log('🔧 The lats_products table may not exist or have RLS issues');
    } else {
      console.log('✅ lats_products table exists and is accessible');
      console.log('📊 Found products:', products?.length || 0);
    }

    // Step 2: Check if lats_product_variants table exists
    console.log('\n📋 Step 2: Checking if lats_product_variants table exists...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('id, product_id, sku')
      .limit(1);
    
    if (variantsError) {
      console.log('❌ lats_product_variants table error:', variantsError.message);
    } else {
      console.log('✅ lats_product_variants table exists and is accessible');
      console.log('📊 Found variants:', variants?.length || 0);
    }

    // Step 3: Test product creation
    console.log('\n📋 Step 3: Testing product creation...');
    const testProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product for debugging',
      is_active: true
    };
    
    const { data: newProduct, error: createError } = await supabase
      .from('lats_products')
      .insert(testProduct)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Product creation failed:', createError.message);
      console.log('📋 Error details:', createError);
    } else {
      console.log('✅ Product creation works!');
      console.log('📦 Created product:', newProduct.id);
      
      // Step 4: Test variant creation with the new product
      console.log('\n📋 Step 4: Testing variant creation...');
      const testVariant = {
        product_id: newProduct.id,
        sku: `TEST-VARIANT-${Date.now()}`
      };
      
      const { data: newVariant, error: variantError } = await supabase
        .from('lats_product_variants')
        .insert(testVariant)
        .select()
        .single();
      
      if (variantError) {
        console.log('❌ Variant creation failed:', variantError.message);
        console.log('📋 Error details:', variantError);
      } else {
        console.log('✅ Variant creation works!');
        console.log('📦 Created variant:', newVariant.id);
        
        // Clean up test data
        await supabase.from('lats_product_variants').delete().eq('id', newVariant.id);
        await supabase.from('lats_products').delete().eq('id', newProduct.id);
        console.log('🧹 Test data cleaned up');
      }
    }

    // Step 5: Check foreign key relationship
    console.log('\n📋 Step 5: Checking foreign key relationship...');
    const { data: relationshipTest, error: relationshipError } = await supabase
      .from('lats_product_variants')
      .select(`
        id,
        product_id,
        sku,
        lats_products!inner(name)
      `)
      .limit(1);
    
    if (relationshipError) {
      console.log('❌ Foreign key relationship test failed:', relationshipError.message);
    } else {
      console.log('✅ Foreign key relationship works');
      console.log('📊 Relationship test result:', relationshipTest?.length || 0);
    }

    console.log('\n🎉 Debug completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugProductCreation();
