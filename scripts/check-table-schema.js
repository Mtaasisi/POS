import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTableSchema() {
  console.log('🔍 Checking lats_product_variants table schema...\n');

  try {
    // Try to select all columns to see what's available
    const { data: allColumns, error: allColumnsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(0);
    
    if (allColumnsError) {
      console.log('❌ Error selecting all columns:', allColumnsError.message);
    } else {
      console.log('✅ All columns select works');
    }

    // Try to select individual columns to see which ones exist
    const columnsToTest = [
      'id', 'product_id', 'sku', 'name', 'attributes', 
      'cost_price', 'selling_price', 'quantity', 'min_quantity', 
      'max_quantity', 'barcode', 'weight', 'dimensions', 
      'created_at', 'updated_at'
    ];

    console.log('\n📋 Testing individual columns:');
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('lats_product_variants')
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
    const minimalVariant = {
      product_id: '00000000-0000-0000-0000-000000000000',
      sku: `TEST-MINIMAL-${Date.now()}`
    };
    
    const { data: insertedVariant, error: insertError } = await supabase
      .from('lats_product_variants')
      .insert(minimalVariant)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Minimal insert failed:', insertError.message);
    } else {
      console.log('✅ Minimal insert works');
      console.log('📦 Inserted variant:', insertedVariant);
      
      // Clean up
      await supabase.from('lats_product_variants').delete().eq('id', insertedVariant.id);
      console.log('🧹 Test data cleaned up');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkTableSchema();
