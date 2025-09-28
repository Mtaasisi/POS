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

async function testExactErrorQuery() {
  console.log('🧪 Testing the exact query that was causing the 400 error...');
  
  try {
    // Test the exact query from the error message
    console.log('\n1. Testing the problematic query with images:product_images(*):');
    const { data: product1, error: error1 } = await supabase
      .from('lats_products')
      .select(`
        *,
        variants:lats_product_variants(*),
        images:product_images(*)
      `)
      .eq('id', '52995b84-a675-43ae-b6bf-48d9b4051ec9')
      .single();
    
    if (error1) {
      console.error('❌ Error (expected):', error1);
    } else {
      console.log('✅ Query successful!');
      console.log('   Product name:', product1?.name);
      console.log('   Images:', product1?.images);
      console.log('   Variants count:', product1?.variants?.length || 0);
    }
    
    // Test if the issue is with the specific product ID
    console.log('\n2. Testing with a different product ID:');
    const { data: products, error: error2 } = await supabase
      .from('lats_products')
      .select(`
        *,
        variants:lats_product_variants(*),
        images:product_images(*)
      `)
      .limit(1);
    
    if (error2) {
      console.error('❌ Error:', error2);
    } else {
      console.log('✅ Query successful!');
      console.log('   Found products:', products?.length || 0);
    }
    
    // Test the product_images table structure
    console.log('\n3. Testing product_images table structure:');
    const { data: imageStructure, error: error3 } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (error3) {
      console.error('❌ Error:', error3);
    } else {
      console.log('✅ product_images table structure:');
      if (imageStructure && imageStructure.length > 0) {
        console.log('   Sample record:', Object.keys(imageStructure[0]));
      } else {
        console.log('   Table is empty');
      }
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

testExactErrorQuery();
