const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAndFixQueries() {
  console.log('🔧 Testing and fixing product queries...');
  
  try {
    // Test the first query that was failing
    console.log('🧪 Testing first query...');
    const { data: data1, error: error1 } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        description,
        category_id,
        brand_id,
        supplier_id,
        images,
        is_active,
        total_quantity,
        total_value,
        condition,
        store_shelf,
        attributes,
        created_at,
        updated_at,
        lats_categories(name, description, color),
        lats_brands(name, logo, website, description),
        lats_suppliers(name, contact_person, email, phone, address, website, notes),
        lats_product_variants(id, product_id, name, sku, cost_price, selling_price, quantity)
      `)
      .limit(5);

    if (error1) {
      console.error('❌ First query failed:', error1);
    } else {
      console.log('✅ First query working! Found', data1?.length || 0, 'products');
    }

    // Test the second query that was failing
    console.log('🧪 Testing second query...');
    const { data: data2, error: error2 } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        category_id,
        brand_id,
        supplier_id,
        tags,
        is_active,
        total_quantity,
        total_value,
        condition,
        store_shelf,
        internal_notes,
        created_at,
        updated_at
      `)
      .limit(5);

    if (error2) {
      console.error('❌ Second query failed:', error2);
      
      // Try to identify which columns are missing
      console.log('🔍 Checking which columns exist...');
      const { data: columns, error: columnsError } = await supabase
        .from('lats_products')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('❌ Cannot check columns:', columnsError);
      } else if (columns && columns.length > 0) {
        console.log('📋 Available columns:', Object.keys(columns[0]));
      }
    } else {
      console.log('✅ Second query working! Found', data2?.length || 0, 'products');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAndFixQueries();
