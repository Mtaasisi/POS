// Script to populate lats_shipping_info table with existing purchase order data
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function populateShippingData() {
  console.log('🚀 Populating shipping data from existing purchase orders...\n');

  try {
    // Step 1: Get purchase orders that have shipping information
    console.log('📋 Step 1: Fetching purchase orders with shipping data...');
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, tracking_number, shipping_status, estimated_delivery_date, shipping_notes')
      .or('status.eq.shipped,status.eq.received,tracking_number.not.is.null,shipping_status.not.is.null')
      .not('tracking_number', 'is', null);

    if (poError) {
      console.log('❌ Error fetching purchase orders:', poError.message);
      return;
    }

    console.log(`✅ Found ${purchaseOrders.length} purchase orders with shipping data`);

    if (purchaseOrders.length === 0) {
      console.log('⚠️ No purchase orders with shipping data found');
      return;
    }

    // Step 2: Get carriers and agents for assignment
    console.log('\n📋 Step 2: Fetching carriers and agents...');
    const [carriersResult, agentsResult] = await Promise.all([
      supabase.from('lats_shipping_carriers').select('id, name, code').eq('is_active', true),
      supabase.from('lats_shipping_agents').select('id, name, company').eq('is_active', true)
    ]);

    if (carriersResult.error) {
      console.log('❌ Error fetching carriers:', carriersResult.error.message);
      return;
    }

    if (agentsResult.error) {
      console.log('❌ Error fetching agents:', agentsResult.error.message);
      return;
    }

    const carriers = carriersResult.data || [];
    const agents = agentsResult.data || [];

    console.log(`✅ Found ${carriers.length} carriers and ${agents.length} agents`);

    // Step 3: Process each purchase order
    console.log('\n📋 Step 3: Processing purchase orders...');
    let successCount = 0;
    let errorCount = 0;

    for (const po of purchaseOrders) {
      try {
        console.log(`\n🔄 Processing: ${po.order_number}`);
        
        // Determine carrier based on tracking number
        let carrierId = null;
        let carrierName = 'Unknown Carrier';
        
        if (po.tracking_number) {
          if (po.tracking_number.startsWith('DHL')) {
            carrierId = carriers.find(c => c.code === 'DHL')?.id;
            carrierName = 'DHL Express';
          } else if (po.tracking_number.startsWith('FEDEX')) {
            carrierId = carriers.find(c => c.code === 'FEDEX')?.id;
            carrierName = 'FedEx';
          } else if (po.tracking_number.startsWith('UPS')) {
            carrierId = carriers.find(c => c.code === 'UPS')?.id;
            carrierName = 'UPS';
          } else if (po.tracking_number.startsWith('MAERSK')) {
            carrierId = carriers.find(c => c.code === 'MAERSK')?.id;
            carrierName = 'Maersk Line';
          } else if (po.tracking_number.startsWith('TED')) {
            carrierId = carriers.find(c => c.code === 'TED')?.id;
            carrierName = 'Tanzania Express Delivery';
          } else {
            // Default to first available carrier
            carrierId = carriers[0]?.id;
            carrierName = carriers[0]?.name || 'Unknown Carrier';
          }
        } else {
          // Default to first available carrier
          carrierId = carriers[0]?.id;
          carrierName = carriers[0]?.name || 'Unknown Carrier';
        }

        // Assign agent (use first available agent)
        const agentId = agents[0]?.id;

        // Determine status
        let status = 'pending';
        if (po.status === 'shipped') {
          status = 'in_transit';
        } else if (po.status === 'received') {
          status = 'delivered';
        }

        // Prepare shipping info data
        const shippingData = {
          purchase_order_id: po.id,
          carrier_id: carrierId,
          agent_id: agentId,
          tracking_number: po.tracking_number || `TRK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          status: status,
          estimated_delivery: po.estimated_delivery_date || null,
          cost: 0,
          require_signature: false,
          enable_insurance: false,
          notes: po.shipping_notes || `Migrated from purchase order ${po.order_number}`
        };

        console.log(`  - Carrier: ${carrierName}`);
        console.log(`  - Agent: ${agents[0]?.name || 'N/A'}`);
        console.log(`  - Tracking: ${shippingData.tracking_number}`);
        console.log(`  - Status: ${status}`);

        // Insert shipping info
        const { data: insertedShipping, error: insertError } = await supabase
          .from('lats_shipping_info')
          .insert(shippingData)
          .select()
          .single();

        if (insertError) {
          console.log(`  ❌ Error inserting shipping info: ${insertError.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Created shipping info: ${insertedShipping.id}`);
          successCount++;

          // Create initial tracking event
          const eventData = {
            shipping_id: insertedShipping.id,
            status: status,
            description: status === 'delivered' ? 'Package delivered successfully' : 'Package shipped and in transit',
            location: 'Origin',
            is_automated: false
          };

          const { error: eventError } = await supabase
            .from('lats_shipping_events')
            .insert(eventData);

          if (eventError) {
            console.log(`  ⚠️ Warning: Could not create tracking event: ${eventError.message}`);
          } else {
            console.log(`  ✅ Created tracking event`);
          }
        }

      } catch (error) {
        console.log(`  ❌ Error processing ${po.order_number}: ${error.message}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n🎉 Shipping data population completed!');
    console.log(`✅ Successfully processed: ${successCount} purchase orders`);
    console.log(`❌ Errors: ${errorCount} purchase orders`);
    
    if (successCount > 0) {
      console.log('\n💡 Next steps:');
      console.log('1. Refresh your shipping management page');
      console.log('2. Check that shipping data is now visible');
      console.log('3. Test the shipping tracker component');
    }

  } catch (error) {
    console.error('❌ Unexpected error during population:', error);
  }
}

// Run the population
populateShippingData();
