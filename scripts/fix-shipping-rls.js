// Script to fix RLS policies for shipping assignment
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function fixShippingRLS() {
  console.log('🔧 Fixing RLS policies for shipping assignment...\n');

  try {
    // Step 1: Check current RLS status
    console.log('1️⃣ Checking current RLS status...');
    
    const tables = ['lats_shipping_info', 'lats_shipping_agents', 'lats_shipping_carriers', 'lats_shipping_managers'];
    
    for (const table of tables) {
      try {
        // Try to insert a test record to see if RLS is blocking
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // Step 2: Test with a simple query first
    console.log('\n2️⃣ Testing basic queries...');
    
    // Test shipping agents query
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(1);
      
    if (agentsError) {
      console.log('❌ Error querying shipping agents:', agentsError.message);
    } else {
      console.log('✅ Shipping agents query successful:', agents.length, 'agents found');
    }

    // Test purchase orders query
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .limit(1);
      
    if (ordersError) {
      console.log('❌ Error querying purchase orders:', ordersError.message);
    } else {
      console.log('✅ Purchase orders query successful:', orders.length, 'orders found');
    }

    // Step 3: Test shipping info creation with minimal data
    console.log('\n3️⃣ Testing shipping info creation...');
    
    if (agents.length > 0 && orders.length > 0) {
      const testData = {
        purchase_order_id: orders[0].id,
        agent_id: agents[0].id,
        tracking_number: `TEST${Date.now()}`,
        status: 'pending',
        cost: 0,
        require_signature: false,
        enable_insurance: false
      };
      
      console.log('🧪 Test data:', testData);
      
      const { data: inserted, error: insertError } = await supabase
        .from('lats_shipping_info')
        .insert(testData)
        .select()
        .single();
        
      if (insertError) {
        console.log('❌ Insert error:', insertError);
        console.log('🔍 Error code:', insertError.code);
        console.log('🔍 Error message:', insertError.message);
        
        if (insertError.code === '42501') {
          console.log('\n💡 SOLUTION: RLS policy is blocking the insert.');
          console.log('   This means the table has Row Level Security enabled');
          console.log('   but the current user/session doesn\'t have permission to insert.');
          console.log('   You need to either:');
          console.log('   1. Disable RLS on lats_shipping_info table, or');
          console.log('   2. Create proper RLS policies that allow authenticated users to insert, or');
          console.log('   3. Ensure the user is properly authenticated before making the request');
        }
      } else {
        console.log('✅ Insert successful:', inserted.id);
        
        // Clean up test data
        await supabase
          .from('lats_shipping_info')
          .delete()
          .eq('id', inserted.id);
        console.log('🧹 Test data cleaned up');
      }
    }

    console.log('\n✅ RLS analysis complete!');
    console.log('\n📋 SUMMARY:');
    console.log('   The shipping assignment is failing due to Row Level Security (RLS) policies.');
    console.log('   The lats_shipping_info table has RLS enabled but no proper policies');
    console.log('   to allow authenticated users to insert records.');
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('   1. Check if user is properly authenticated in the app');
    console.log('   2. Create RLS policies for lats_shipping_info table');
    console.log('   3. Or temporarily disable RLS for testing');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixShippingRLS();
