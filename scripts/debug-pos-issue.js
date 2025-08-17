import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugPOSIssue() {
  console.log('🔍 Debugging POS System Issue...\n');
  
  try {
    // Test 1: Check if we can access the table at all
    console.log('📋 Test 1: Basic table access...');
    const { data: allProducts, error: allError } = await supabase
      .from('lats_products')
      .select('*');

    if (allError) {
      console.log(`   ❌ Error accessing table: ${allError.message}`);
      console.log('   🔧 This suggests RLS or permission issues');
    } else {
      console.log(`   ✅ Can access table. Found ${allProducts?.length || 0} total products`);
    }

    // Test 2: Check active products specifically
    console.log('\n📋 Test 2: Active products only...');
    const { data: activeProducts, error: activeError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('is_active', true);

    if (activeError) {
      console.log(`   ❌ Error fetching active products: ${activeError.message}`);
    } else {
      console.log(`   ✅ Found ${activeProducts?.length || 0} active products`);
      
      if (activeProducts && activeProducts.length > 0) {
        console.log('   📦 Active products:');
        activeProducts.forEach(product => {
          console.log(`     - ${product.name} (ID: ${product.id})`);
        });
      }
    }

    // Test 3: Check product variants
    console.log('\n📋 Test 3: Product variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*');

    if (variantsError) {
      console.log(`   ❌ Error fetching variants: ${variantsError.message}`);
    } else {
      console.log(`   ✅ Found ${variants?.length || 0} product variants`);
    }

    // Test 4: Check categories and brands
    console.log('\n📋 Test 4: Categories and brands...');
    const { data: categories } = await supabase.from('lats_categories').select('*');
    const { data: brands } = await supabase.from('lats_brands').select('*');
    
    console.log(`   ✅ Categories: ${categories?.length || 0}`);
    console.log(`   ✅ Brands: ${brands?.length || 0}`);

    // Test 5: Check if products have proper relationships
    console.log('\n📋 Test 5: Products with relationships...');
    const { data: productsWithRelations, error: relationsError } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_brands(name),
        lats_product_variants(*)
      `)
      .eq('is_active', true);

    if (relationsError) {
      console.log(`   ❌ Error fetching products with relations: ${relationsError.message}`);
    } else {
      console.log(`   ✅ Found ${productsWithRelations?.length || 0} products with relationships`);
      
      if (productsWithRelations && productsWithRelations.length > 0) {
        console.log('   📦 Products with details:');
        productsWithRelations.forEach(product => {
          console.log(`     - ${product.name}`);
          console.log(`       Category: ${product.lats_categories?.name || 'None'}`);
          console.log(`       Brand: ${product.lats_brands?.name || 'None'}`);
          console.log(`       Variants: ${product.lats_product_variants?.length || 0}`);
        });
      }
    }

    // Summary and recommendations
    console.log('\n📊 Summary:');
    const totalProducts = allProducts?.length || 0;
    const activeCount = activeProducts?.length || 0;
    const variantsCount = variants?.length || 0;
    
    console.log(`   Total products in database: ${totalProducts}`);
    console.log(`   Active products: ${activeCount}`);
    console.log(`   Product variants: ${variantsCount}`);

    if (totalProducts > 0 && activeCount === 0) {
      console.log('\n🔧 Issue identified: Products exist but none are active!');
      console.log('📋 Solution: Set is_active = true for products in Supabase');
    } else if (totalProducts === 0) {
      console.log('\n🔧 Issue identified: No products in database');
      console.log('📋 Solution: Add products using the quick-fix-pos-data.sql script');
    } else if (activeCount > 0 && variantsCount === 0) {
      console.log('\n🔧 Issue identified: Products exist but no variants');
      console.log('📋 Solution: Add product variants');
    } else if (activeCount > 0 && variantsCount > 0) {
      console.log('\n✅ Products and variants exist!');
      console.log('🔧 The issue might be in the application code or authentication');
      console.log('📋 Check browser console for JavaScript errors');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error.message);
  }
}

debugPOSIssue();
