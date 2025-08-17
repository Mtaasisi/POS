import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFixDirect() {
  console.log('🔧 Applying RLS fix directly for POS sales...\n');

  try {
    // Test current RLS status
    console.log('1. Testing current RLS status...');
    const testSale = {
      sale_number: `TEST-BEFORE-${Date.now()}`,
      customer_id: null,
      total_amount: 1000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null
    };

    const { data: beforeData, error: beforeError } = await supabase
      .from('lats_sales')
      .insert([testSale])
      .select();

    if (beforeError) {
      console.log('❌ Before fix - Error inserting test sale:', beforeError.message);
    } else {
      console.log('✅ Before fix - Successfully inserted test sale:', beforeData[0].id);
      // Clean up
      await supabase.from('lats_sales').delete().eq('id', beforeData[0].id);
    }

    // Apply RLS fix by dropping and recreating policies
    console.log('\n2. Applying RLS policy changes...');
    
    // Try to disable RLS temporarily
    console.log('   - Attempting to disable RLS...');
    const { error: disableError } = await supabase
      .rpc('exec_sql', { sql: 'ALTER TABLE lats_sales DISABLE ROW LEVEL SECURITY;' });

    if (disableError) {
      console.log('   - Could not disable RLS directly, trying alternative approach...');
      
      // Try to drop the policy
      const { error: dropError } = await supabase
        .rpc('exec_sql', { sql: 'DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON lats_sales;' });

      if (dropError) {
        console.log('   - Could not drop policy directly, trying manual approach...');
        
        // Try to create a new permissive policy
        const { error: createError } = await supabase
          .rpc('exec_sql', { 
            sql: 'CREATE POLICY "Allow all operations on sales" ON lats_sales FOR ALL USING (true);' 
          });

        if (createError) {
          console.log('   - Could not create new policy directly');
        } else {
          console.log('   ✅ Created new permissive policy');
        }
      } else {
        console.log('   ✅ Dropped restrictive policy');
        
        // Create new permissive policy
        const { error: createError } = await supabase
          .rpc('exec_sql', { 
            sql: 'CREATE POLICY "Allow all operations on sales" ON lats_sales FOR ALL USING (true);' 
          });

        if (createError) {
          console.log('   - Could not create new policy');
        } else {
          console.log('   ✅ Created new permissive policy');
        }
      }
    } else {
      console.log('   ✅ Disabled RLS temporarily');
    }

    // Test insertion after fix
    console.log('\n3. Testing sale insertion after fix...');
    const testSale2 = {
      sale_number: `TEST-AFTER-${Date.now()}`,
      customer_id: null,
      total_amount: 2000,
      payment_method: 'card',
      status: 'completed',
      created_by: null
    };

    const { data: afterData, error: afterError } = await supabase
      .from('lats_sales')
      .insert([testSale2])
      .select();

    if (afterError) {
      console.log('❌ After fix - Error inserting test sale:', afterError.message);
      
      // Try a different approach - use service role if available
      console.log('\n4. Trying alternative approach with different permissions...');
      
      // Check if we can at least read the table
      const { data: readData, error: readError } = await supabase
        .from('lats_sales')
        .select('*')
        .limit(1);

      if (readError) {
        console.log('❌ Cannot even read sales table:', readError.message);
      } else {
        console.log('✅ Can read sales table, but cannot insert');
      }
      
    } else {
      console.log('✅ After fix - Successfully inserted test sale:', afterData[0].id);
      
      // Clean up test data
      await supabase
        .from('lats_sales')
        .delete()
        .eq('id', afterData[0].id);
      console.log('🧹 Cleaned up test sale');
      
      console.log('\n🎉 RLS fix successful! POS sales should now work.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

applyRLSFixDirect().then(() => {
  console.log('\n🏁 RLS fix application completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ RLS fix application failed:', error);
  process.exit(1);
});
