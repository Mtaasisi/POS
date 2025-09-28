import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQueries() {
  console.log('🧪 Testing fixed queries...');
  
  try {
    // Test 1: The original problematic query (should now work)
    console.log('\n1. Testing original query (should work now):');
    const { data: product1, error: error1 } = await supabase
      .from('lats_products')
      .select(`
        *,
        variants:lats_product_variants(*)
      `)
      .eq('id', '52995b84-a675-43ae-b6bf-48d9b4051ec9')
      .single();
    
    if (error1) {
      console.error('❌ Error:', error1);
    } else {
      console.log('✅ Query successful!');
      console.log('   Product name:', product1?.name);
      console.log('   Images:', product1?.images);
      console.log('   Variants count:', product1?.variants?.length || 0);
    }
    
    // Test 2: Search products query (should work)
    console.log('\n2. Testing search products query:');
    const { data: products, error: error2 } = await supabase
      .from('lats_products')
      .select(`
        *,
        lats_categories(name),
        lats_product_variants(*)
      `)
      .or(`name.ilike.%iPad%`)
      .eq('is_active', true)
      .limit(3);
    
    if (error2) {
      console.error('❌ Error:', error2);
    } else {
      console.log('✅ Search query successful!');
      console.log('   Found products:', products?.length || 0);
    }
    
    // Test 3: Test product_images table (should fail gracefully)
    console.log('\n3. Testing product_images table (should fail gracefully):');
    const { data: images, error: error3 } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (error3) {
      console.log('⚠️  product_images table not accessible (expected):', error3.message);
    } else {
      console.log('✅ product_images table accessible');
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testFixedQueries();
