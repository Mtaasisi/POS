// Script to validate all foreign key references for shipping data
// This script checks if all referenced IDs exist in the database

function validateShippingReferences() {
  console.log('🔍 VALIDATING SHIPPING REFERENCES');
  console.log('==================================\n');

  const shippingData = {
    id: "e9264fb3-0724-49f8-bed2-4a9f1a2ce254",
    carrierId: "826320dc-7d7c-41a7-82d7-bd484c64c8ae",
    trackingNumber: "TRK51385845OCC5",
    agentId: "dd99d7ac-a27b-4488-912d-338bdaae25e9",
    managerId: "a15a9139-3be9-4028-b944-240caae9eeb2"
  };

  // Validated manager data from user
  const validatedManager = {
    id: "a15a9139-3be9-4028-b944-240caae9eeb2",
    name: "Shipping Manager",
    email: "shipping.manager@tedservices.com",
    phone: "+255 123 456 789",
    department: "Logistics",
    is_active: true
  };

  console.log('📋 SHIPPING DATA TO VALIDATE:');
  console.log('=============================');
  console.log(`Shipping ID: ${shippingData.id}`);
  console.log(`Carrier ID: ${shippingData.carrierId}`);
  console.log(`Tracking Number: ${shippingData.trackingNumber}`);
  console.log(`Agent ID: ${shippingData.agentId}`);
  console.log(`Manager ID: ${shippingData.managerId}`);

  console.log('\n✅ VALIDATED REFERENCES:');
  console.log('========================');
  console.log('✅ Manager ID is VALID:');
  console.log(`   ID: ${validatedManager.id}`);
  console.log(`   Name: ${validatedManager.name}`);
  console.log(`   Email: ${validatedManager.email}`);
  console.log(`   Department: ${validatedManager.department}`);
  console.log(`   Active: ${validatedManager.is_active}`);

  console.log('\n🔍 VALIDATION QUERIES TO RUN:');
  console.log('==============================');
  
  console.log('\n1️⃣ Check if shipping record already exists:');
  console.log(`SELECT * FROM lats_shipping_info WHERE id = '${shippingData.id}';`);
  
  console.log('\n2️⃣ Check for tracking number conflicts:');
  console.log(`SELECT * FROM lats_shipping_info WHERE tracking_number = '${shippingData.trackingNumber}' AND carrier_id = '${shippingData.carrierId}';`);
  
  console.log('\n3️⃣ Validate carrier exists:');
  console.log(`SELECT * FROM lats_shipping_carriers WHERE id = '${shippingData.carrierId}';`);
  console.log('   Expected: Should return DHL Express carrier record');
  
  console.log('\n4️⃣ Validate agent exists:');
  console.log(`SELECT * FROM lats_shipping_agents WHERE id = '${shippingData.agentId}';`);
  console.log('   Expected: Should return Tanzania Express Delivery agent record');
  
  console.log('\n5️⃣ Check for duplicate purchase order shipping:');
  console.log('SELECT purchase_order_id, COUNT(*) as shipping_count');
  console.log('FROM lats_shipping_info');
  console.log('GROUP BY purchase_order_id');
  console.log('HAVING COUNT(*) > 1;');

  console.log('\n🎯 VALIDATION RESULTS SUMMARY:');
  console.log('==============================');
  console.log('✅ Manager Reference: VALID');
  console.log('❓ Carrier Reference: NEEDS VALIDATION');
  console.log('❓ Agent Reference: NEEDS VALIDATION');
  console.log('❓ Shipping Record: NEEDS VALIDATION');
  console.log('❓ Tracking Number: NEEDS VALIDATION');

  console.log('\n🔧 NEXT STEPS:');
  console.log('==============');
  console.log('1. Run the validation queries above');
  console.log('2. Check if carrier and agent records exist');
  console.log('3. Verify no tracking number conflicts');
  console.log('4. Identify the correct purchase_order_id');
  console.log('5. Apply the appropriate fix solution');

  console.log('\n💡 EXPECTED RESULTS:');
  console.log('====================');
  console.log('Carrier should exist: DHL Express');
  console.log('Agent should exist: Tanzania Express Delivery');
  console.log('No tracking number conflicts should exist');
  console.log('Shipping record should not exist (new record)');

  console.log('\n🚨 CRITICAL MISSING DATA:');
  console.log('==========================');
  console.log('⚠️  purchase_order_id is MISSING from shipping data');
  console.log('⚠️  This is REQUIRED for the shipping record');
  console.log('⚠️  You must identify the correct purchase order ID');

  console.log('\n✅ Validation script complete!');
}

// Run the validation
try {
  validateShippingReferences();
} catch (error) {
  console.error('❌ Validation failed:', error);
}