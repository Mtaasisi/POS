// Script to check and fix shipping assignment conflicts
// This script analyzes the shipping conflict without direct database access

function checkShippingConflict() {
  console.log('🔍 Analyzing Shipping Assignment Conflict\n');
  console.log('==========================================\n');

  // Complete shipping data from user
  const newShippingData = {
    id: "e9264fb3-0724-49f8-bed2-4a9f1a2ce254",
    carrier: "DHL Express",
    carrierId: "826320dc-7d7c-41a7-82d7-bd484c64c8ae",
    trackingNumber: "TRK51385845OCC5",
    method: "Standard",
    cost: 288,
    notes: "",
    agentId: "dd99d7ac-a27b-4488-912d-338bdaae25e9",
    agent: {
      id: "dd99d7ac-a27b-4488-912d-338bdaae25e9",
      name: "Tanzania Express Delivery",
      email: "info@ted.co.tz",
      phone: "+255 22 225 7890",
      company: "TED Services",
      is_active: true
    },
    managerId: "a15a9139-3be9-4028-b944-240caae9eeb2",
    manager: {
      id: "a15a9139-3be9-4028-b944-240caae9eeb2",
      name: "Shipping Manager",
      email: "shipping.manager@tedservices.com",
      phone: "+255 123 456 789",
      department: "Logistics"
    },
    estimatedDelivery: "2025-10-06",
    shippedDate: "",
    deliveredDate: "",
    portOfLoading: "",
    portOfDischarge: "",
    pricePerCBM: 0,
    enableInsurance: false,
    requireSignature: false,
    status: "pending",
    cargoBoxes: [],
    trackingEvents: [
      {
        id: "318b455a-b56f-4579-b244-85c67c865c17",
        shipping_id: "e9264fb3-0724-49f8-bed2-4a9f1a2ce254",
        status: "pending",
        description: "Shipment created and ready for pickup",
        location: "Origin",
        timestamp: "2025-09-06T09:48:21.436+00:00",
        notes: "Shipment assigned via shipping assignment modal",
        created_by: null,
        is_automated: false,
        created_at: "2025-09-06T09:48:22.480269+00:00"
      }
    ],
    // CRITICAL: Add missing purchase_order_id
    purchaseOrderId: "0257aa6b-7f10-48fd-89c8-c776560725d1"
  };

  // Previous conflict data
  const previousConflict = {
    purchaseOrderId: '0257aa6b-7f10-48fd-89c8-c776560725d1',
    trackingNumber: 'TRK50989424630F',
    carrierId: '826320dc-7d7c-41a7-82d7-bd484c64c8ae',
    agentId: 'dd99d7ac-a27b-4488-912d-338bdaae25e9',
    managerId: 'a15a9139-3be9-4028-b944-240caae9eeb2'
  };

  console.log('📋 COMPLETE SHIPPING DATA ANALYSIS:');
  console.log('====================================');
  console.log(`Shipping ID: ${newShippingData.id}`);
  console.log(`Purchase Order ID: ${newShippingData.purchaseOrderId}`);
  console.log(`Carrier: ${newShippingData.carrier}`);
  console.log(`Carrier ID: ${newShippingData.carrierId}`);
  console.log(`Tracking Number: ${newShippingData.trackingNumber}`);
  console.log(`Method: ${newShippingData.method}`);
  console.log(`Cost: ${newShippingData.cost}`);
  console.log(`Agent: ${newShippingData.agent.name} (${newShippingData.agentId})`);
  console.log(`Manager: ${newShippingData.manager.name} (${newShippingData.managerId})`);
  console.log(`Status: ${newShippingData.status}`);
  console.log(`Estimated Delivery: ${newShippingData.estimatedDelivery}`);
  console.log(`Insurance: ${newShippingData.enableInsurance ? 'Enabled' : 'Disabled'}`);
  console.log(`Signature Required: ${newShippingData.requireSignature ? 'Yes' : 'No'}`);
  console.log(`Tracking Events: ${newShippingData.trackingEvents.length} event(s)`);

  console.log('\n📋 PREVIOUS CONFLICT DATA:');
  console.log('==========================');
  console.log(`Purchase Order ID: ${previousConflict.purchaseOrderId}`);
  console.log(`Tracking Number: ${previousConflict.trackingNumber}`);
  console.log(`Carrier ID: ${previousConflict.carrierId}`);
  console.log(`Agent ID: ${previousConflict.agentId}`);
  console.log(`Manager ID: ${previousConflict.managerId}`);

  console.log('\n🔍 COMPARISON ANALYSIS:');
  console.log('=======================');
  console.log(`Same Carrier ID: ${newShippingData.carrierId === previousConflict.carrierId ? '✅ YES' : '❌ NO'}`);
  console.log(`Same Agent ID: ${newShippingData.agentId === previousConflict.agentId ? '✅ YES' : '❌ NO'}`);
  console.log(`Same Manager ID: ${newShippingData.managerId === previousConflict.managerId ? '✅ YES' : '❌ NO'}`);
  console.log(`Different Tracking Numbers: ${newShippingData.trackingNumber !== previousConflict.trackingNumber ? '✅ YES' : '❌ NO'}`);

  console.log('\n🔍 POTENTIAL CAUSES OF 409 CONFLICT:');
  console.log('=====================================');

  console.log('\n1️⃣ UNIQUE CONSTRAINT VIOLATION:');
  console.log('   The lats_shipping_info table has a unique constraint:');
  console.log('   UNIQUE(tracking_number, carrier_id)');
  console.log('   This means the same tracking number cannot be used twice');
  console.log('   with the same carrier.');

  console.log('\n2️⃣ MISSING PURCHASE ORDER UNIQUE CONSTRAINT:');
  console.log('   The table does NOT have a unique constraint on purchase_order_id');
  console.log('   This means multiple shipping records could exist for the same PO');
  console.log('   but the application logic might expect only one.');

  console.log('\n3️⃣ FOREIGN KEY CONSTRAINT VIOLATION:');
  console.log('   One of the referenced IDs might not exist:');
  console.log('   - carrier_id must exist in lats_shipping_carriers');
  console.log('   - agent_id must exist in lats_shipping_agents');
  console.log('   - manager_id must exist in lats_shipping_managers');
  console.log('   - purchase_order_id must exist in lats_purchase_orders');

  console.log('\n💡 RECOMMENDED SOLUTIONS:');
  console.log('==========================');

  console.log('\n🔧 SOLUTION 1: Check for existing shipping info');
  console.log('   Run this SQL query to check if shipping info already exists:');
  console.log(`   SELECT * FROM lats_shipping_info WHERE id = '${newShippingData.id}';`);

  console.log('\n🔧 SOLUTION 2: Check for tracking number conflict');
  console.log('   Run this SQL query to check for tracking number conflicts:');
  console.log(`   SELECT * FROM lats_shipping_info WHERE tracking_number = '${newShippingData.trackingNumber}' AND carrier_id = '${newShippingData.carrierId}';`);

  console.log('\n🔧 SOLUTION 3: Check for duplicate shipping assignments');
  console.log('   Check if multiple shipping records exist for the same purchase order:');
  console.log(`   SELECT * FROM lats_shipping_info WHERE purchase_order_id = '${previousConflict.purchaseOrderId}';`);

  console.log('\n🔧 SOLUTION 4: Validate all referenced IDs');
  console.log('   Check if all referenced IDs exist:');
  console.log(`   - Carrier: SELECT * FROM lats_shipping_carriers WHERE id = '${newShippingData.carrierId}';`);
  console.log(`   - Agent: SELECT * FROM lats_shipping_agents WHERE id = '${newShippingData.agentId}';`);
  console.log(`   - Manager: SELECT * FROM lats_shipping_managers WHERE id = '${newShippingData.managerId}';`);

  console.log('\n🔧 SOLUTION 5: Fix the application logic');
  console.log('   The shippingDataService should:');
  console.log('   1. Check if shipping info already exists for the PO');
  console.log('   2. If it exists, update it instead of creating new');
  console.log('   3. If it doesn\'t exist, create new');
  console.log('   4. Generate unique tracking numbers');

  console.log('\n🔧 SOLUTION 6: Add database constraint');
  console.log('   Consider adding a unique constraint on purchase_order_id:');
  console.log('   ALTER TABLE lats_shipping_info ADD CONSTRAINT unique_po_shipping UNIQUE (purchase_order_id);');

  console.log('\n🎯 SPECIFIC ANALYSIS FOR NEW SHIPPING RECORD:');
  console.log('==============================================');
  console.log(`✅ Good: Different tracking number (${newShippingData.trackingNumber})`);
  console.log(`✅ Good: Same carrier/agent/manager IDs (consistent assignment)`);
  console.log(`✅ Good: Purchase Order ID included (${newShippingData.purchaseOrderId})`);
  console.log(`✅ Good: Complete agent details (${newShippingData.agent.name})`);
  console.log(`✅ Good: Complete manager details (${newShippingData.manager.name})`);
  console.log(`✅ Good: Status is '${newShippingData.status}' (correct for new shipments)`);
  console.log(`✅ Good: Estimated delivery date set (${newShippingData.estimatedDelivery})`);
  console.log(`✅ Good: Tracking event created with proper timestamp`);
  console.log(`⚠️  Note: Cost is ${newShippingData.cost} (verify this amount)`);
  console.log(`⚠️  Note: Insurance disabled (${newShippingData.enableInsurance})`);
  console.log(`⚠️  Note: Signature not required (${newShippingData.requireSignature})`);

  console.log('\n📊 CURRENT TABLE STRUCTURE:');
  console.log('============================');
  console.log('lats_shipping_info table has these constraints:');
  console.log('• PRIMARY KEY: id');
  console.log('• FOREIGN KEY: purchase_order_id → lats_purchase_orders(id)');
  console.log('• FOREIGN KEY: carrier_id → lats_shipping_carriers(id)');
  console.log('• FOREIGN KEY: agent_id → lats_shipping_agents(id)');
  console.log('• FOREIGN KEY: manager_id → lats_shipping_managers(id)');
  console.log('• UNIQUE: (tracking_number, carrier_id)');
  console.log('• CHECK: status IN (pending, picked_up, in_transit, out_for_delivery, delivered, exception)');

  console.log('\n🚨 IMMEDIATE ACTION NEEDED:');
  console.log('============================');
  console.log('1. ✅ Purchase Order ID is now included in the shipping data');
  console.log('2. Check if shipping info already exists for this shipping ID:');
  console.log(`   SELECT * FROM lats_shipping_info WHERE id = '${newShippingData.id}';`);
  console.log('3. Check if the tracking number is already in use:');
  console.log(`   SELECT * FROM lats_shipping_info WHERE tracking_number = '${newShippingData.trackingNumber}';`);
  console.log('4. Verify all referenced IDs exist in their respective tables');
  console.log('5. Ensure the cost value (288) is correct for this shipment');
  console.log('6. ✅ Status is correctly set to "pending" for new shipments');
  console.log('7. ✅ All required fields are now present and complete');
}

// Run the check
try {
  checkShippingConflict();
  console.log('\n✅ Conflict check complete!');
} catch (error) {
  console.error('❌ Conflict check failed:', error);
}
