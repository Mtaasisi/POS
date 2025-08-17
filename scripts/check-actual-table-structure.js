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

async function checkActualTableStructure() {
  console.log('🔍 Checking actual table structure...\n');
  
  try {
    // Check lats_categories table structure
    console.log('📂 Checking lats_categories table structure...');
    
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(1);
    
    if (categoriesError) {
      console.error('❌ Error accessing lats_categories:', categoriesError);
    } else {
      console.log('✅ lats_categories table accessible');
      if (categoriesData && categoriesData.length > 0) {
        console.log('   Columns:', Object.keys(categoriesData[0]));
      } else {
        console.log('   Table is empty, checking schema...');
        // Try to insert a test record to see the structure
        const { data: testCat, error: testCatError } = await supabase
          .from('lats_categories')
          .insert({ name: 'Test Category', description: 'Test' })
          .select()
          .single();
        
        if (testCatError) {
          console.error('❌ Error with test insert:', testCatError);
        } else {
          console.log('   Columns from test insert:', Object.keys(testCat));
          // Clean up
          await supabase.from('lats_categories').delete().eq('id', testCat.id);
        }
      }
    }
    
    // Check lats_brands table structure
    console.log('\n🏷️  Checking lats_brands table structure...');
    
    const { data: brandsData, error: brandsError } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(1);
    
    if (brandsError) {
      console.error('❌ Error accessing lats_brands:', brandsError);
    } else {
      console.log('✅ lats_brands table accessible');
      if (brandsData && brandsData.length > 0) {
        console.log('   Columns:', Object.keys(brandsData[0]));
      } else {
        console.log('   Table is empty, checking schema...');
        // Try to insert a test record to see the structure
        const { data: testBrand, error: testBrandError } = await supabase
          .from('lats_brands')
          .insert({ name: 'Test Brand', description: 'Test' })
          .select()
          .single();
        
        if (testBrandError) {
          console.error('❌ Error with test insert:', testBrandError);
        } else {
          console.log('   Columns from test insert:', Object.keys(testBrand));
          // Clean up
          await supabase.from('lats_brands').delete().eq('id', testBrand.id);
        }
      }
    }
    
    // Check lats_suppliers table structure
    console.log('\n🏢 Checking lats_suppliers table structure...');
    
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .limit(1);
    
    if (suppliersError) {
      console.error('❌ Error accessing lats_suppliers:', suppliersError);
    } else {
      console.log('✅ lats_suppliers table accessible');
      if (suppliersData && suppliersData.length > 0) {
        console.log('   Columns:', Object.keys(suppliersData[0]));
      } else {
        console.log('   Table is empty, checking schema...');
        // Try to insert a test record to see the structure
        const { data: testSupplier, error: testSupplierError } = await supabase
          .from('lats_suppliers')
          .insert({ name: 'Test Supplier', contact_person: 'Test' })
          .select()
          .single();
        
        if (testSupplierError) {
          console.error('❌ Error with test insert:', testSupplierError);
        } else {
          console.log('   Columns from test insert:', Object.keys(testSupplier));
          // Clean up
          await supabase.from('lats_suppliers').delete().eq('id', testSupplier.id);
        }
      }
    }
    
    // Check lats_products table structure
    console.log('\n📦 Checking lats_products table structure...');
    
    const { data: productsData, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(1);
    
    if (productsError) {
      console.error('❌ Error accessing lats_products:', productsError);
    } else {
      console.log('✅ lats_products table accessible');
      if (productsData && productsData.length > 0) {
        console.log('   Columns:', Object.keys(productsData[0]));
      } else {
        console.log('   Table is empty, checking schema...');
        // Try to insert a test record to see the structure
        const { data: testProduct, error: testProductError } = await supabase
          .from('lats_products')
          .insert({ name: 'Test Product', description: 'Test' })
          .select()
          .single();
        
        if (testProductError) {
          console.error('❌ Error with test insert:', testProductError);
        } else {
          console.log('   Columns from test insert:', Object.keys(testProduct));
          // Clean up
          await supabase.from('lats_products').delete().eq('id', testProduct.id);
        }
      }
    }
    
    // Check lats_product_variants table structure
    console.log('\n🔄 Checking lats_product_variants table structure...');
    
    const { data: variantsData, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(1);
    
    if (variantsError) {
      console.error('❌ Error accessing lats_product_variants:', variantsError);
    } else {
      console.log('✅ lats_product_variants table accessible');
      if (variantsData && variantsData.length > 0) {
        console.log('   Columns:', Object.keys(variantsData[0]));
      } else {
        console.log('   Table is empty, checking schema...');
        // Try to insert a test record to see the structure
        const { data: testVariant, error: testVariantError } = await supabase
          .from('lats_product_variants')
          .insert({ 
            product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            sku: 'TEST-SKU',
            name: 'Test Variant'
          })
          .select()
          .single();
        
        if (testVariantError) {
          console.error('❌ Error with test insert:', testVariantError);
        } else {
          console.log('   Columns from test insert:', Object.keys(testVariant));
          // Clean up
          await supabase.from('lats_product_variants').delete().eq('id', testVariant.id);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkActualTableStructure()
  .then(() => {
    console.log('\n✅ Table structure check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error during check:', error);
    process.exit(1);
  });
