// Script to validate all referenced IDs in shipping data
// This script checks if all foreign key references exist in their respective tables

function validateShippingIds() {
  console.log('🔍 Validating Shipping Data References\n');
  console.log('======================================\n');

  // Complete shipping data
  const shippingData = {
    id: "e9264fb3-0724-49f8-bed2-4a9f1a2ce254",
    purchaseOrderId: "0257aa6b-7f10-48fd-89c8-c776560725d1",
    carrierId: "826320dc-7d7c-41a7-82d7-bd484c64c8ae",
    agentId: "dd99d7ac-a27b-4488-912d-338bdaae25e9",
    managerId: "a15a9139-3be9-4028-b944-240caae9eeb2",
    trackingNumber: "TRK51385845OCC5"
  };

  console.log('📋 SHIPPING DATA TO VALIDATE:');
  console.log('==============================');
  console.log(`Shipping ID: ${shippingData.id}`);
  console.log(`Purchase Order ID: ${shippingData.purchaseOrderId}`);
  console.log(`Carrier ID: ${shippingData.carrierId}`);
  console.log(`Agent ID: ${shippingData.agentId}`);
  console.log(`Manager ID: ${shippingData.managerId}`);
  console.log(`Tracking Number: ${shippingData.trackingNumber}`);

  console.log('\n🔍 VALIDATION QUERIES:');
  console.log('=======================');

  console.log('\n1️⃣ CHECK PURCHASE ORDER EXISTS:');
  console.log('   SELECT id, order_number, status FROM lats_purchase_orders');
  console.log(`   WHERE id = '${shippingData.purchaseOrderId}';`);

  console.log('\n2️⃣ CHECK CARRIER EXISTS:');
  console.log('   SELECT id, name, is_active FROM lats_shipping_carriers');
  console.log(`   WHERE id = '${shippingData.carrierId}';`);

  console.log('\n3️⃣ CHECK AGENT EXISTS:');
  console.log('   SELECT id, name, company, is_active FROM lats_shipping_agents');
  console.log(`   WHERE id = '${shippingData.agentId}';`);

  console.log('\n4️⃣ CHECK MANAGER EXISTS:');
  console.log('   SELECT id, name, department FROM lats_shipping_managers');
  console.log(`   WHERE id = '${shippingData.managerId}';`);

  console.log('\n5️⃣ CHECK FOR EXISTING SHIPPING RECORD:');
  console.log('   SELECT id, purchase_order_id, tracking_number, status FROM lats_shipping_info');
  console.log(`   WHERE id = '${shippingData.id}';`);

  console.log('\n6️⃣ CHECK FOR TRACKING NUMBER CONFLICT:');
  console.log('   SELECT id, purchase_order_id, tracking_number, carrier_id FROM lats_shipping_info');
  console.log(`   WHERE tracking_number = '${shippingData.trackingNumber}' AND carrier_id = '${shippingData.carrierId}';`);

  console.log('\n7️⃣ CHECK FOR DUPLICATE PO SHIPPING:');
  console.log('   SELECT id, purchase_order_id, tracking_number, status FROM lats_shipping_info');
  console.log(`   WHERE purchase_order_id = '${shippingData.purchaseOrderId}';`);

  console.log('\n8️⃣ CHECK TRACKING EVENTS:');
  console.log('   SELECT id, shipping_id, status, description, timestamp FROM lats_shipping_tracking_events');
  console.log(`   WHERE shipping_id = '${shippingData.id}';`);

  console.log('\n💡 EXPECTED RESULTS:');
  console.log('=====================');
  console.log('✅ Purchase Order: Should return 1 row with valid order');
  console.log('✅ Carrier: Should return 1 row with active carrier');
  console.log('✅ Agent: Should return 1 row with active agent');
  console.log('✅ Manager: Should return 1 row with valid manager');
  console.log('❌ Existing Shipping: Should return 0 rows (new record)');
  console.log('❌ Tracking Conflict: Should return 0 rows (unique tracking)');
  console.log('❌ Duplicate PO: Should return 0 rows (one shipping per PO)');
  console.log('✅ Tracking Events: Should return 1 row (initial event)');

  console.log('\n🚨 POTENTIAL ISSUES TO CHECK:');
  console.log('==============================');
  console.log('1. If Purchase Order query returns 0 rows:');
  console.log('   → Purchase Order ID does not exist');
  console.log('   → Check if PO was deleted or ID is incorrect');
  console.log('');
  console.log('2. If Carrier query returns 0 rows:');
  console.log('   → Carrier ID does not exist');
  console.log('   → Check if carrier was deleted or ID is incorrect');
  console.log('');
  console.log('3. If Agent query returns 0 rows:');
  console.log('   → Agent ID does not exist');
  console.log('   → Check if agent was deleted or ID is incorrect');
  console.log('');
  console.log('4. If Manager query returns 0 rows:');
  console.log('   → Manager ID does not exist');
  console.log('   → Check if manager was deleted or ID is incorrect');
  console.log('');
  console.log('5. If Existing Shipping query returns 1+ rows:');
  console.log('   → Shipping record already exists');
  console.log('   → Consider updating instead of creating new');
  console.log('');
  console.log('6. If Tracking Conflict query returns 1+ rows:');
  console.log('   → Tracking number already used with same carrier');
  console.log('   → Generate new unique tracking number');
  console.log('');
  console.log('7. If Duplicate PO query returns 1+ rows:');
  console.log('   → Multiple shipping records for same PO');
  console.log('   → Check business logic for multiple shipments per PO');

  console.log('\n🔧 QUICK FIX QUERIES:');
  console.log('======================');
  console.log('If you need to clean up conflicts:');
  console.log('');
  console.log('-- Delete existing shipping record (if needed):');
  console.log(`-- DELETE FROM lats_shipping_info WHERE id = '${shippingData.id}';`);
  console.log('');
  console.log('-- Delete existing tracking events (if needed):');
  console.log(`-- DELETE FROM lats_shipping_tracking_events WHERE shipping_id = '${shippingData.id}';`);
  console.log('');
  console.log('-- Check for orphaned tracking events:');
  console.log('-- SELECT * FROM lats_shipping_tracking_events WHERE shipping_id NOT IN (SELECT id FROM lats_shipping_info);');

  console.log('\n📊 COMPLETE VALIDATION CHECKLIST:');
  console.log('===================================');
  console.log('□ Purchase Order exists and is valid');
  console.log('□ Carrier exists and is active');
  console.log('□ Agent exists and is active');
  console.log('□ Manager exists and is valid');
  console.log('□ No existing shipping record with same ID');
  console.log('□ No tracking number conflict with same carrier');
  console.log('□ No duplicate shipping for same PO');
  console.log('□ Tracking events are properly linked');
  console.log('□ All foreign key constraints satisfied');
  console.log('□ Ready for shipping record creation');
}

// Run the validation
try {
  validateShippingIds();
  console.log('\n✅ ID validation complete!');
  console.log('Run the SQL queries above to verify all references exist.');
} catch (error) {
  console.error('❌ ID validation failed:', error);
}
