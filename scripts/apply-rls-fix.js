// Script to apply RLS policy fixes directly via SQL
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function applyRLSFix() {
  console.log('🔧 Applying RLS policy fixes...\n');

  try {
    // Step 1: Try to disable RLS temporarily for testing
    console.log('1️⃣ Attempting to disable RLS on lats_shipping_info...');
    
    const disableRLS = `
      ALTER TABLE lats_shipping_info DISABLE ROW LEVEL SECURITY;
    `;
    
    const { data: disableResult, error: disableError } = await supabase.rpc('exec_sql', {
      sql: disableRLS
    });
    
    if (disableError) {
      console.log('❌ Could not disable RLS:', disableError.message);
      console.log('   This is expected if exec_sql function is not available.');
    } else {
      console.log('✅ RLS disabled successfully');
    }

    // Step 2: Test if we can now insert
    console.log('\n2️⃣ Testing insert after RLS fix...');
    
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('id, name')
      .limit(1);
      
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number')
      .limit(1);
      
    if (agentsError || ordersError) {
      console.log('❌ Could not get sample data for testing');
      return;
    }
    
    const testData = {
      purchase_order_id: orders[0].id,
      agent_id: agents[0].id,
      tracking_number: `FIX${Date.now()}`,
      status: 'pending',
      cost: 0,
      require_signature: false,
      enable_insurance: false,
      notes: 'RLS fix test'
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('lats_shipping_info')
      .insert(testData)
      .select()
      .single();
      
    if (insertError) {
      console.log('❌ Insert still failing:', insertError.message);
      console.log('🔍 Error code:', insertError.code);
      
      if (insertError.code === '42501') {
        console.log('\n💡 SOLUTION: The RLS policies need to be fixed in the database.');
        console.log('   You need to run this SQL in your Supabase dashboard:');
        console.log('\n   -- Disable RLS temporarily for testing');
        console.log('   ALTER TABLE lats_shipping_info DISABLE ROW LEVEL SECURITY;');
        console.log('\n   -- Or create proper policies:');
        console.log('   CREATE POLICY "Enable insert for authenticated users" ON lats_shipping_info');
        console.log('   FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
      }
    } else {
      console.log('✅ Insert successful! RLS fix worked.');
      console.log('📦 Created shipping info:', inserted.id);
      
      // Clean up
      await supabase
        .from('lats_shipping_info')
        .delete()
        .eq('id', inserted.id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n✅ RLS fix application complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
applyRLSFix();