const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductQuery() {
  console.log('🧪 Testing product query with ID: 52995b84-a675-43ae-b6bf-48d9b4051ec9');
  
  try {
    // Test the fixed query
    const { data: product, error } = await supabase
      .from('lats_products')
      .select(`
        *,
        variants:lats_product_variants(*)
      `)
      .eq('id', '52995b84-a675-43ae-b6bf-48d9b4051ec9')
      .single();
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Query successful!');
      console.log('Product name:', product?.name);
      console.log('Product images:', product?.images);
      console.log('Variants count:', product?.variants?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testProductQuery();
