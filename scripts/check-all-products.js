import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkAllProducts() {
  console.log('🔍 Checking ALL products in database (including inactive)...\n');
  
  try {
    // Check all products regardless of active status
    const { data: allProducts, error } = await supabase
      .from('lats_products')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!allProducts || allProducts.length === 0) {
      console.log('📭 No products found in database at all');
      console.log('\n📋 This means:');
      console.log('   - The database is completely empty');
      console.log('   - You need to add products using the quick-fix-pos-data.sql script');
      console.log('   - Or RLS policies are blocking access completely');
      return;
    }

    console.log(`✅ Found ${allProducts.length} total products:\n`);

    allProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Active: ${product.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Description: ${product.description || 'N/A'}`);
      console.log(`   Quantity: ${product.total_quantity || 0}`);
      console.log(`   Value: $${product.total_value || 0}`);
      console.log(`   Created: ${product.created_at}`);
      console.log('');
    });

    // Count active vs inactive
    const activeProducts = allProducts.filter(p => p.is_active);
    const inactiveProducts = allProducts.filter(p => !p.is_active);

    console.log('📊 Summary:');
    console.log(`   Total products: ${allProducts.length}`);
    console.log(`   Active products: ${activeProducts.length}`);
    console.log(`   Inactive products: ${inactiveProducts.length}`);

    if (inactiveProducts.length > 0) {
      console.log('\n🔧 Found inactive products!');
      console.log('📋 To make them visible in POS system:');
      console.log('   1. Go to Supabase Dashboard');
      console.log('   2. Go to Table Editor > lats_products');
      console.log('   3. Set is_active = true for the products you want to show');
    }

    if (activeProducts.length > 0) {
      console.log('\n✅ Active products found!');
      console.log('🔧 If POS still doesn\'t show them, check:');
      console.log('   - Browser console for JavaScript errors');
      console.log('   - Application authentication status');
      console.log('   - Network tab for API errors');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAllProducts();
