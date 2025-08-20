import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Test basic connection
    console.log('📡 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection error:', testError);
      return;
    }

    console.log('✅ Database connection successful');

    // Check lats_products table structure
    console.log('\n📋 Checking lats_products table structure...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.error('❌ Error accessing lats_products table:', productsError);
      return;
    }

    if (products && products.length > 0) {
      const sampleProduct = products[0];
      console.log('✅ lats_products table accessible');
      console.log('📊 Sample product fields:', Object.keys(sampleProduct));
    } else {
      console.log('ℹ️ lats_products table is empty');
    }

    // Check lats_product_variants table structure
    console.log('\n📋 Checking lats_product_variants table structure...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(1);

    if (variantsError) {
      console.error('❌ Error accessing lats_product_variants table:', variantsError);
      return;
    }

    if (variants && variants.length > 0) {
      const sampleVariant = variants[0];
      console.log('✅ lats_product_variants table accessible');
      console.log('📊 Sample variant fields:', Object.keys(sampleVariant));
    } else {
      console.log('ℹ️ lats_product_variants table is empty');
    }

    // Try to create a test product
    console.log('\n🧪 Testing product creation...');
    const testProductData = {
      name: 'Test Product',
      description: 'Test product for schema validation',
      sku: 'TEST-001',
      category_id: null,
      brand_id: null,
      supplier_id: null,
      is_active: true
    };

    const { data: newProduct, error: createError } = await supabase
      .from('lats_products')
      .insert([testProductData])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test product:', createError);
      console.error('Error details:', createError.details);
      console.error('Error hint:', createError.hint);
    } else {
      console.log('✅ Test product created successfully:', newProduct.id);
      
      // Clean up test product
      const { error: deleteError } = await supabase
        .from('lats_products')
        .delete()
        .eq('id', newProduct.id);

      if (deleteError) {
        console.error('⚠️ Error deleting test product:', deleteError);
      } else {
        console.log('🧹 Test product cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkDatabaseSchema();
