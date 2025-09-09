// Script to fix and save shipment data using RPC functions
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

async function fixAndSaveShipmentWithRPC() {
  console.log('🔧 Fixing and saving shipment data using RPC...\n');

  try {
    // Step 1: Get available carriers
    const { data: carriers, error: carriersError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, name, contact_person, phone, email, is_active
        FROM lats_shipping_carriers 
        WHERE is_active = true 
        ORDER BY name 
        LIMIT 5
      `
    });

    if (carriersError) {
      console.log('❌ Error fetching carriers:', carriersError.message);
      return;
    }

    if (!carriers || carriers.length === 0) {
      console.log('⚠️ No active carriers found. Creating a default carrier...');
      
      // Create a default carrier using RPC
      const { data: newCarrier, error: createCarrierError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO lats_shipping_carriers (name, contact_person, phone, email, is_active)
          VALUES ('Default Carrier', 'Default Contact', '+255000000000', 'default@carrier.com', true)
          RETURNING id, name
        `
      });

      if (createCarrierError) {
        console.log('❌ Error creating default carrier:', createCarrierError.message);
        return;
      }

      console.log('✅ Created default carrier:', newCarrier[0].name);
      carriers.push(newCarrier[0]);
    }

    // Step 2: Get available agents
    const { data: agents, error: agentsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, name, company, phone, email, is_active
        FROM lats_shipping_agents 
        WHERE is_active = true 
        ORDER BY name 
        LIMIT 5
      `
    });

    if (agentsError) {
      console.log('❌ Error fetching agents:', agentsError.message);
      return;
    }

    if (!agents || agents.length === 0) {
      console.log('⚠️ No active agents found. Creating a default agent...');
      
      // Create a default agent using RPC
      const { data: newAgent, error: createAgentError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO lats_shipping_agents (name, company, phone, email, is_active)
          VALUES ('Default Agent', 'Default Company', '+255000000000', 'agent@default.com', true)
          RETURNING id, name
        `
      });

      if (createAgentError) {
        console.log('❌ Error creating default agent:', createAgentError.message);
        return;
      }

      console.log('✅ Created default agent:', newAgent[0].name);
      agents.push(newAgent[0]);
    }

    // Step 3: Get a purchase order
    const { data: purchaseOrders, error: poError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT id, order_number, status, created_at
        FROM lats_purchase_orders 
        ORDER BY created_at DESC 
        LIMIT 1
      `
    });

    if (poError) {
      console.log('❌ Error fetching purchase orders:', poError.message);
      return;
    }

    if (!purchaseOrders || purchaseOrders.length === 0) {
      console.log('❌ No purchase orders found to link shipment');
      return;
    }

    console.log('📋 Using purchase order:', purchaseOrders[0].order_number);

    // Step 4: Insert the shipment using RPC
    const insertSQL = `
      INSERT INTO lats_shipping_info (
        purchase_order_id,
        carrier_id,
        agent_id,
        tracking_number,
        status,
        estimated_delivery,
        cost,
        require_signature,
        enable_insurance,
        notes
      ) VALUES (
        '${purchaseOrders[0].id}',
        '${carriers[0].id}',
        '${agents[0].id}',
        '${shipmentData.trackingNumber}',
        'pending',
        ${shipmentData.estimatedDelivery ? `'${shipmentData.estimatedDelivery}'` : 'NULL'},
        ${shipmentData.cost},
        ${shipmentData.requireSignature},
        ${shipmentData.enableInsurance},
        ${shipmentData.notes ? `'${shipmentData.notes}'` : 'NULL'}
      )
      RETURNING id, tracking_number, status, created_at
    `;

    const { data: savedShipment, error: saveError } = await supabase.rpc('exec_sql', {
      sql: insertSQL
    });

    if (saveError) {
      console.log('❌ Error saving shipment:', saveError.message);
      return;
    }

    console.log('✅ Shipment saved successfully!');
    console.log('📋 Shipment ID:', savedShipment[0].id);
    console.log('📋 Tracking Number:', savedShipment[0].tracking_number);
    console.log('📋 Status:', savedShipment[0].status);
    console.log('📋 Created:', savedShipment[0].created_at);

    // Step 5: Create initial tracking event
    const eventSQL = `
      INSERT INTO lats_shipping_events (
        shipping_id,
        status,
        description,
        location,
        is_automated
      ) VALUES (
        '${savedShipment[0].id}',
        'pending',
        'Shipment created and ready for pickup',
        'Origin',
        false
      )
      RETURNING id, status, description
    `;

    const { data: event, error: eventError } = await supabase.rpc('exec_sql', {
      sql: eventSQL
    });

    if (eventError) {
      console.log('⚠️ Warning: Could not create initial tracking event:', eventError.message);
    } else {
      console.log('✅ Initial tracking event created:', event[0].description);
    }

    console.log('\n🎉 Shipment processing complete!');
    console.log('📦 Your shipment is now in the system and ready for tracking.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixAndSaveShipmentWithRPC();
