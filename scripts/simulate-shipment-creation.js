// Script to simulate proper shipment creation through the application flow
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

async function simulateShipmentCreation() {
  console.log('🚀 Simulating shipment creation through application flow...\n');

  try {
    // Step 1: Get available resources
    console.log('📋 Fetching available resources...');
    
    const [carriersResult, agentsResult, purchaseOrdersResult] = await Promise.all([
      supabase.from('lats_shipping_carriers').select('id, name, code, contact_info').eq('is_active', true),
      supabase.from('lats_shipping_agents').select('id, name, company, phone, email').eq('is_active', true),
      supabase.from('lats_purchase_orders').select('id, order_number, status').order('created_at', { ascending: false }).limit(1)
    ]);

    if (carriersResult.error) {
      console.log('❌ Error fetching carriers:', carriersResult.error.message);
      return;
    }

    if (agentsResult.error) {
      console.log('❌ Error fetching agents:', agentsResult.error.message);
      return;
    }

    if (purchaseOrdersResult.error) {
      console.log('❌ Error fetching purchase orders:', purchaseOrdersResult.error.message);
      return;
    }

    const carriers = carriersResult.data || [];
    const agents = agentsResult.data || [];
    const purchaseOrders = purchaseOrdersResult.data || [];

    console.log(`✅ Found ${carriers.length} carriers, ${agents.length} agents, ${purchaseOrders.length} purchase orders`);

    if (carriers.length === 0 || agents.length === 0 || purchaseOrders.length === 0) {
      console.log('❌ Missing required resources. Please ensure you have carriers, agents, and purchase orders.');
      return;
    }

    // Step 2: Prepare the complete shipment data
    const selectedCarrier = carriers[0];
    const selectedAgent = agents[0];
    const selectedPO = purchaseOrders[0];

    const completeShipmentData = {
      ...shipmentData,
      carrier: selectedCarrier.name,
      carrierId: selectedCarrier.id,
      agentId: selectedAgent.id,
      agent: {
        id: selectedAgent.id,
        name: selectedAgent.name,
        company: selectedAgent.company,
        phone: selectedAgent.phone,
        email: selectedAgent.email
      },
      status: 'pending',
      estimatedDelivery: shipmentData.estimatedDelivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      shippedDate: new Date().toISOString().split('T')[0]
    };

    console.log('📦 Complete shipment data prepared:');
    console.log(JSON.stringify(completeShipmentData, null, 2));

    // Step 3: Create a JSON file with the complete data for manual import
    const fs = await import('fs');
    const path = await import('path');
    
    const outputPath = path.join(process.cwd(), 'shipment-data-complete.json');
    fs.writeFileSync(outputPath, JSON.stringify(completeShipmentData, null, 2));
    
    console.log(`\n✅ Complete shipment data saved to: ${outputPath}`);
    console.log('\n📋 Summary:');
    console.log(`  - Tracking Number: ${completeShipmentData.trackingNumber}`);
    console.log(`  - Carrier: ${completeShipmentData.carrier}`);
    console.log(`  - Agent: ${completeShipmentData.agent.name}`);
    console.log(`  - Purchase Order: ${selectedPO.order_number}`);
    console.log(`  - Status: ${completeShipmentData.status}`);
    console.log(`  - Estimated Delivery: ${completeShipmentData.estimatedDelivery}`);

    // Step 4: Provide instructions for manual creation
    console.log('\n🔧 Next Steps:');
    console.log('1. Copy the complete shipment data from the JSON file');
    console.log('2. Use the application UI to create a shipment with this data');
    console.log('3. Or use the updatePurchaseOrderShipping method in the application');
    console.log('\n💡 The data is now properly formatted and ready for use!');

    // Step 5: Show how to use it in the application
    console.log('\n🚀 To use this data in your application:');
    console.log('```javascript');
    console.log('// In your component or store:');
    console.log('const shippingInfo = ' + JSON.stringify(completeShipmentData, null, 2) + ';');
    console.log('// Then call:');
    console.log('await updatePurchaseOrderShipping(purchaseOrderId, shippingInfo);');
    console.log('```');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the simulation
simulateShipmentCreation();
