import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProductsSchema() {
  console.log('🔍 Checking lats_products table schema...\n');

  try {
    // Try to select all columns to see what's available
    const { data: allColumns, error: allColumnsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(0);
    
    if (allColumnsError) {
      console.log('❌ Error selecting all columns:', allColumnsError.message);
    } else {
      console.log('✅ All columns select works');
    }

    // Try to select individual columns to see which ones exist
    const columnsToTest = [
      'id', 'name', 'description', 'category_id', 'brand_id', 'supplier_id',
      'images', 'tags', 'is_active', 'total_quantity', 'total_value', 
      'created_at', 'updated_at'
    ];

    console.log('\n📋 Testing individual columns:');
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('lats_products')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`❌ ${column}: ${error.message}`);
        } else {
          console.log(`✅ ${column}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${column}: ${err.message}`);
      }
    }

    // Try to insert a minimal record to see what's required
    console.log('\n📋 Testing minimal insert...');
    const minimalProduct = {
      name: `Test Product ${Date.now()}`
    };
    
    const { data: insertedProduct, error: insertError } = await supabase
      .from('lats_products')
      .insert(minimalProduct)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError.message);
    } else {
      console.log('✅ Minimal insert works');
      console.log('📦 Inserted product:', insertedProduct);
      
      // Clean up
      await supabase.from('lats_products').delete().eq('id', insertedProduct.id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProductsSchema();
