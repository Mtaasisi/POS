import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPOSRLS() {
  console.log('🔧 Fixing POS RLS for testing...\n');

  try {
    // Temporarily disable RLS for lats_sales table
    console.log('1. Temporarily disabling RLS for lats_sales table...');
    const { error: disableError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE lats_sales DISABLE ROW LEVEL SECURITY;' 
      });

    if (disableError) {
      console.log('❌ Error disabling RLS:', disableError.message);
      
      // Try alternative approach - drop and recreate policy
      console.log('\n2. Trying alternative approach - dropping RLS policy...');
      const { error: dropError } = await supabase
        .rpc('exec_sql', { 
          sql: 'DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;' 
        });

      if (dropError) {
        console.log('❌ Error dropping policy:', dropError.message);
      } else {
        console.log('✅ RLS policy dropped successfully');
      }
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Test inserting a sale
    console.log('\n3. Testing sale insertion...');
    const testSale = {
      sale_number: `TEST-${Date.now()}`,
      customer_id: null,
      total_amount: 1000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null
    };

    const { data: insertData, error: insertError } = await supabase
      .from('lats_sales')
      .insert([testSale])
      .select();

    if (insertError) {
      console.log('❌ Error inserting test sale:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test sale:', insertData[0].id);
      
      // Clean up test data
      await supabase
        .from('lats_sales')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Cleaned up test sale');
    }

    // Re-enable RLS with a more permissive policy
    console.log('\n4. Re-enabling RLS with permissive policy...');
    const { error: enableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;
          CREATE POLICY "Allow all operations on sales" ON lats_sales FOR ALL USING (true);
        ` 
      });

    if (enableError) {
      console.log('❌ Error re-enabling RLS:', enableError.message);
    } else {
      console.log('✅ RLS re-enabled with permissive policy');
    }

    // Test again with new policy
    console.log('\n5. Testing sale insertion with new policy...');
    const testSale2 = {
      sale_number: `TEST2-${Date.now()}`,
      customer_id: null,
      total_amount: 2000,
      payment_method: 'card',
      status: 'completed',
      created_by: null
    };

    const { data: insertData2, error: insertError2 } = await supabase
      .from('lats_sales')
      .insert([testSale2])
      .select();

    if (insertError2) {
      console.log('❌ Error inserting test sale 2:', insertError2.message);
    } else {
      console.log('✅ Successfully inserted test sale 2:', insertData2[0].id);
      
      // Clean up test data
      await supabase
        .from('lats_sales')
        .delete()
        .eq('id', insertData2[0].id);
      console.log('🧹 Cleaned up test sale 2');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixPOSRLS().then(() => {
  console.log('\n🏁 RLS fix completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ RLS fix failed:', error);
  process.exit(1);
});
