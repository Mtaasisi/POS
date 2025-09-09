// Script to fix and save shipment data
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// The shipment data you provided
const shipmentData = {
  "carrier": "Unknown Carrier",
  "trackingNumber": "TRK4495130640ZD",
  "method": "Standard",
  "cost": 0,
  "notes": "",
  "agentId": "",
  "agent": null,
  "managerId": "",
  "estimatedDelivery": "",
  "shippedDate": "",
  "deliveredDate": "",
  "portOfLoading": "",
  "portOfDischarge": "",
  "pricePerCBM": 0,
  "enableInsurance": false,
  "requireSignature": false,
  "cargoBoxes": []
};

async function fixAndSaveShipment() {
  console.log('🔧 Fixing and saving shipment data...\n');

  try {
    // Step 1: Check if we have any carriers available
    const { data: carriers, error: carriersError } = await supabase
      .from('lats_shipping_carriers')
      .select('id, name')
      .eq('is_active', true);

    if (carriersError) {
      console.log('❌ Error fetching carriers:', carriersError.message);
      return;
    }

    if (!carriers || carriers.length === 0) {
      console.log('⚠️ No active carriers found. Creating a default carrier...');
      
      // Create a default carrier
      const { data: newCarrier, error: createCarrierError } = await supabase
        .from('lats_shipping_carriers')
        .insert({
          name: 'Default Carrier',
          contact_person: 'Default Contact',
          phone: '+255000000000',
          email: 'default@carrier.com',
          is_active: true
        })
        .select()
        .single();

      if (createCarrierError) {
        console.log('❌ Error creating default carrier:', createCarrierError.message);
        return;
      }

      console.log('✅ Created default carrier:', newCarrier.name);
      carriers.push(newCarrier);
    }

    // Step 2: Check if we have any agents available
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('id, name, company, phone, email')
      .eq('is_active', true);

    if (agentsError) {
      console.log('❌ Error fetching agents:', agentsError.message);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️ No active agents found. Creating a default agent...');
      
      // Create a default agent
      const { data: newAgent, error: createAgentError } = await supabase
        .from('lats_shipping_agents')
        .insert({
          name: 'Default Agent',
          company: 'Default Company',
          phone: '+255000000000',
          email: 'agent@default.com',
          is_active: true
        })
        .select()
        .single();

      if (createAgentError) {
        console.log('❌ Error creating default agent:', createAgentError.message);
        return;
      }

      console.log('✅ Created default agent:', newAgent.name);
      agents.push(newAgent);
    }

    // Step 3: Get a sample purchase order to link the shipment
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .order('created_at', { ascending: false })
      .limit(1);

    if (poError) {
      console.log('❌ Error fetching purchase orders:', poError.message);
      return;
    }

    if (!purchaseOrders || purchaseOrders.length === 0) {
      console.log('❌ No purchase orders found to link shipment');
      console.log('Please create a purchase order first or provide a specific purchase_order_id');
      return;
    }

    // Step 4: Prepare the fixed shipment data
    const fixedShipmentData = {
      purchase_order_id: purchaseOrders[0].id,
      carrier_id: carriers[0].id,
      agent_id: agents[0].id,
      tracking_number: shipmentData.trackingNumber,
      status: 'pending',
      estimated_delivery: shipmentData.estimatedDelivery || null,
      cost: shipmentData.cost,
      require_signature: shipmentData.requireSignature,
      enable_insurance: shipmentData.enableInsurance,
      notes: shipmentData.notes || null
    };

    console.log('📦 Fixed shipment data:');
    console.log(JSON.stringify(fixedShipmentData, null, 2));

    // Step 5: Save the shipment to the database
    const { data: savedShipment, error: saveError } = await supabase
      .from('lats_shipping_info')
      .insert(fixedShipmentData)
      .select()
      .single();

    if (saveError) {
      console.log('❌ Error saving shipment:', saveError.message);
      return;
    }

    console.log('✅ Shipment saved successfully!');
    console.log('📋 Shipment ID:', savedShipment.id);
    console.log('📋 Tracking Number:', savedShipment.tracking_number);
    console.log('📋 Carrier:', carriers[0].name);
    console.log('📋 Agent:', agents[0].name);

    // Step 6: Create initial tracking event
    const { error: eventError } = await supabase
      .from('lats_shipping_events')
      .insert({
        shipping_id: savedShipment.id,
        status: 'pending',
        description: 'Shipment created and ready for pickup',
        location: 'Origin',
        is_automated: false
      });

    if (eventError) {
      console.log('⚠️ Warning: Could not create initial tracking event:', eventError.message);
    } else {
      console.log('✅ Initial tracking event created');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixAndSaveShipment();
