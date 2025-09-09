// Debug script for shipping assignment issues
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function debugShippingAssignment() {
  console.log('🔍 Starting comprehensive shipping assignment debug...\n');

  try {
    // Step 1: Check if all required tables exist by trying to query them
    console.log('1️⃣ Checking database tables...');
    const tables = [
      'lats_shipping_info',
      'lats_shipping_agents', 
      'lats_shipping_carriers',
      'lats_shipping_managers',
      'lats_purchase_orders'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${table} error:`, error.message);
        } else {
          console.log(`✅ Table ${table} exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table ${table} not accessible:`, err.message);
      }
    }

    // Step 2: Check table structures by examining sample data
    console.log('\n2️⃣ Checking table structures...');
    
    // Check lats_shipping_info structure
    const { data: shippingInfoSample, error: shippingInfoError } = await supabase
      .from('lats_shipping_info')
      .select('*')
      .limit(1);

    if (shippingInfoError) {
      console.log('❌ Error checking lats_shipping_info structure:', shippingInfoError.message);
    } else if (shippingInfoSample && shippingInfoSample.length > 0) {
      console.log('📊 lats_shipping_info sample record:');
      Object.keys(shippingInfoSample[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof shippingInfoSample[0][key]}`);
      });
    } else {
      console.log('📊 lats_shipping_info table is empty - checking with insert test...');
    }

    // Step 3: Check for sample data
    console.log('\n3️⃣ Checking for sample data...');
    
    // Check shipping agents
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('*')
      .limit(5);

    if (agentsError) {
      console.log('❌ Error fetching shipping agents:', agentsError.message);
    } else {
      console.log(`📦 Found ${agents.length} shipping agents:`);
      agents.forEach(agent => {
        console.log(`  - ${agent.name} (${agent.company}) - Active: ${agent.is_active}`);
      });
    }

    // Check purchase orders
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .limit(5);

    if (poError) {
      console.log('❌ Error fetching purchase orders:', poError.message);
    } else {
      console.log(`📋 Found ${purchaseOrders.length} purchase orders:`);
      purchaseOrders.forEach(po => {
        console.log(`  - ${po.order_number || po.id} - Status: ${po.status}`);
        console.log(`    Available fields: ${Object.keys(po).join(', ')}`);
      });
    }

    // Step 4: Test shipping info creation
    console.log('\n4️⃣ Testing shipping info creation...');
    
    if (purchaseOrders.length > 0 && agents.length > 0) {
      const testPO = purchaseOrders[0];
      const testAgent = agents[0];
      
      console.log(`🧪 Testing with PO: ${testPO.order_number} and Agent: ${testAgent.name}`);
      
      const testShippingData = {
        purchase_order_id: testPO.id,
        carrier_id: null,
        agent_id: testAgent.id,
        manager_id: null,
        tracking_number: `DEBUG${Date.now()}`,
        status: 'pending',
        estimated_delivery: null,
        cost: 0,
        require_signature: false,
        enable_insurance: false,
        notes: 'Debug test shipping info'
      };

      console.log('📝 Test shipping data:', testShippingData);

      const { data: insertedShipping, error: insertError } = await supabase
        .from('lats_shipping_info')
        .insert(testShippingData)
        .select(`
          *,
          carrier:lats_shipping_carriers(id, name, code, tracking_url, contact_info),
          agent:lats_shipping_agents(id, name, company, phone, email, is_active),
          manager:lats_shipping_managers(id, name, department, phone, email)
        `)
        .single();

      if (insertError) {
        console.log('❌ Error creating test shipping info:', insertError);
        console.log('🔍 Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
      } else {
        console.log('✅ Test shipping info created successfully:', insertedShipping.id);
        
        // Clean up test data
        await supabase
          .from('lats_shipping_info')
          .delete()
          .eq('id', insertedShipping.id);
        console.log('🧹 Test data cleaned up');
      }
    } else {
      console.log('⚠️ Cannot test shipping info creation - missing sample data');
    }

    // Step 5: Test user permissions and authentication
    console.log('\n5️⃣ Testing user permissions...');
    
    const { data: currentUser, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('❌ Error getting current user:', userError.message);
    } else {
      console.log('👤 Current user:', currentUser.user?.email || 'Anonymous');
    }


    console.log('\n✅ Debug complete! Check the output above for any issues.');

  } catch (error) {
    console.error('❌ Unexpected error during debug:', error);
  }
}

// Run the debug
debugShippingAssignment();
