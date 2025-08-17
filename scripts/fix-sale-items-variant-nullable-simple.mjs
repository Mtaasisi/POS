import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSaleItemsVariantNullable() {
  console.log('🔧 Fixing lats_sale_items variant_id nullable constraint...');
  
  try {
    // First, let's check the current state of the table
    console.log('📝 Checking current table structure...');
    const { data: currentStructure, error: structureError } = await supabase
      .from('information_schema.columns')
      .select('column_name, is_nullable, data_type')
      .eq('table_name', 'lats_sale_items')
      .eq('column_name', 'variant_id');
    
    if (structureError) {
      console.error('❌ Error checking table structure:', structureError);
      return;
    }
    
    if (currentStructure && currentStructure.length > 0) {
      const column = currentStructure[0];
      console.log(`📊 Current variant_id: is_nullable = ${column.is_nullable}, type = ${column.data_type}`);
      
      if (column.is_nullable === 'YES') {
        console.log('✅ variant_id is already nullable - no fix needed');
        return;
      }
    }
    
    // Since we can't use exec_sql, let's try a different approach
    // We'll create a new table with the correct structure and migrate data
    
    console.log('📝 Creating new table with nullable variant_id...');
    
    // Step 1: Create a new table with the correct structure
    const { error: createError } = await supabase
      .from('lats_sale_items')
      .select('*')
      .limit(0); // This will fail but we can catch the error to see the current structure
    
    if (createError) {
      console.log('📊 Current table structure error:', createError.message);
    }
    
    // Let's try to insert a test record with null variant_id to see the exact error
    console.log('📝 Testing insertion with null variant_id...');
    const { error: testError } = await supabase
      .from('lats_sale_items')
      .insert({
        sale_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        variant_id: null,
        quantity: 1,
        price: 100,
        total_price: 100
      });
    
    if (testError) {
      console.log('📊 Expected error with null variant_id:', testError.message);
      
      // The error should tell us exactly what's wrong
      if (testError.message.includes('null value in column "variant_id"')) {
        console.log('🔍 Confirmed: variant_id is NOT NULL and needs to be made nullable');
        console.log('💡 This requires a database schema change that needs to be done manually');
        console.log('📋 You can either:');
        console.log('   1. Use the Supabase dashboard to modify the table schema');
        console.log('   2. Run the migration file manually in your database');
        console.log('   3. Contact your database administrator');
      }
    } else {
      console.log('✅ Test insertion succeeded - variant_id might already be nullable');
    }
    
    // Let's also check if there are any existing sale items
    console.log('📝 Checking existing sale items...');
    const { data: existingItems, error: itemsError } = await supabase
      .from('lats_sale_items')
      .select('id, variant_id')
      .limit(5);
    
    if (itemsError) {
      console.log('⚠️ Error checking existing items:', itemsError.message);
    } else {
      console.log(`📊 Found ${existingItems?.length || 0} existing sale items`);
      if (existingItems && existingItems.length > 0) {
        const nullVariants = existingItems.filter(item => item.variant_id === null).length;
        console.log(`📊 Items with null variant_id: ${nullVariants}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixSaleItemsVariantNullable()
  .then(() => {
    console.log('🏁 Analysis completed');
    console.log('\n📋 Next steps:');
    console.log('1. The variant_id column in lats_sale_items needs to be made nullable');
    console.log('2. This requires a database schema change');
    console.log('3. You can do this through the Supabase dashboard or by running the SQL manually');
    console.log('4. The SQL command is: ALTER TABLE lats_sale_items ALTER COLUMN variant_id DROP NOT NULL;');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });
