// Script to check the remaining shipping references
// Since we know the agent exists, let's check the other references

function checkRemainingReferences() {
  console.log('🔍 Checking Remaining Shipping References\n');
  console.log('==========================================\n');

  console.log('✅ AGENT CONFIRMED:');
  console.log('===================');
  console.log('ID: dd99d7ac-a27b-4488-912d-338bdaae25e9');
  console.log('Name: Tanzania Express Delivery');
  console.log('Company: TED Services');
  console.log('Status: Active ✅\n');

  console.log('🔍 REMAINING REFERENCES TO CHECK:');
  console.log('==================================');

  const purchaseOrderId = '0257aa6b-7f10-48fd-89c8-c776560725d1';
  const carrierId = '826320dc-7d7c-41a7-82d7-bd484c64c8ae';
  const managerId = 'a15a9139-3be9-4028-b944-240caae9eeb2';

  console.log('\n1️⃣ CHECK PURCHASE ORDER:');
  console.log('-------------------------');
  console.log(`SELECT id, order_number, status, created_at FROM lats_purchase_orders WHERE id = '${purchaseOrderId}';`);

  console.log('\n2️⃣ CHECK CARRIER:');
  console.log('------------------');
  console.log(`SELECT id, name, code, is_active FROM lats_shipping_carriers WHERE id = '${carrierId}';`);

  console.log('\n3️⃣ CHECK MANAGER:');
  console.log('------------------');
  console.log(`SELECT id, name, department FROM lats_shipping_managers WHERE id = '${managerId}';`);

  console.log('\n4️⃣ CHECK EXISTING SHIPPING INFO:');
  console.log('----------------------------------');
  console.log(`SELECT * FROM lats_shipping_info WHERE purchase_order_id = '${purchaseOrderId}';`);

  console.log('\n💡 QUICK FIX OPTIONS:');
  console.log('======================');

  console.log('\n🔧 OPTION 1: If Purchase Order is missing');
  console.log('   - The purchase order may have been deleted');
  console.log('   - Check if you can find it with a different query:');
  console.log('   SELECT * FROM lats_purchase_orders WHERE order_number LIKE \'%0257%\' OR id LIKE \'%0257%\';');

  console.log('\n🔧 OPTION 2: If Carrier is missing');
  console.log('   - Create a new carrier or use an existing one');
  console.log('   - Check available carriers:');
  console.log('   SELECT id, name, code FROM lats_shipping_carriers LIMIT 5;');

  console.log('\n🔧 OPTION 3: If Manager is missing');
  console.log('   - Create a new manager or use an existing one');
  console.log('   - Check available managers:');
  console.log('   SELECT id, name, department FROM lats_shipping_managers LIMIT 5;');

  console.log('\n🔧 OPTION 4: If existing shipping info exists');
  console.log('   - Delete existing shipping info:');
  console.log(`   DELETE FROM lats_shipping_info WHERE purchase_order_id = '${purchaseOrderId}';`);

  console.log('\n🚨 MOST LIKELY ISSUES:');
  console.log('======================');

  console.log('\n❌ Issue 1: Purchase Order Deleted');
  console.log('   - The purchase order may have been deleted from the database');
  console.log('   - Check if it exists in a different table or was soft-deleted');

  console.log('\n❌ Issue 2: Carrier Not Found');
  console.log('   - The carrier ID may be incorrect or the carrier was deleted');
  console.log('   - Create a new carrier or use an existing one');

  console.log('\n❌ Issue 3: Manager Not Found');
  console.log('   - The manager ID may be incorrect or the manager was deleted');
  console.log('   - Create a new manager or use an existing one');

  console.log('\n✅ NEXT STEPS:');
  console.log('===============');
  console.log('1. Run the 3 remaining validation queries above');
  console.log('2. Identify which reference is missing');
  console.log('3. Either create the missing record or use an existing ID');
  console.log('4. Try the shipping assignment again');

  console.log('\n🔍 DEBUGGING TIP:');
  console.log('==================');
  console.log('The error "Invalid data: The selected agent, carrier, or purchase order is not valid"');
  console.log('means exactly one of these foreign key references is missing:');
  console.log('- purchase_order_id (most likely)');
  console.log('- carrier_id (possible)');
  console.log('- manager_id (possible)');
  console.log('- agent_id (confirmed to exist ✅)');
}

// Run the check
try {
  checkRemainingReferences();
  console.log('\n✅ Reference check complete!');
} catch (error) {
  console.error('❌ Reference check failed:', error);
}
