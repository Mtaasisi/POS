// Script to check the final two shipping references
// Since we know the agent and purchase order exist, let's check carrier and manager

function checkFinalReferences() {
  console.log('🔍 Checking Final Shipping References\n');
  console.log('=====================================\n');

  console.log('✅ CONFIRMED REFERENCES:');
  console.log('========================');
  console.log('Agent: Tanzania Express Delivery (dd99d7ac-a27b-4488-912d-338bdaae25e9) ✅');
  console.log('Purchase Order: PO-1757150343.690743 (0257aa6b-7f10-48fd-89c8-c776560725d1) ✅\n');

  console.log('🔍 FINAL REFERENCES TO CHECK:');
  console.log('==============================');

  const carrierId = '826320dc-7d7c-41a7-82d7-bd484c64c8ae';
  const managerId = 'a15a9139-3be9-4028-b944-240caae9eeb2';

  console.log('\n1️⃣ CHECK CARRIER:');
  console.log('------------------');
  console.log(`SELECT id, name, code, is_active FROM lats_shipping_carriers WHERE id = '${carrierId}';`);

  console.log('\n2️⃣ CHECK MANAGER:');
  console.log('------------------');
  console.log(`SELECT id, name, department FROM lats_shipping_managers WHERE id = '${managerId}';`);

  console.log('\n3️⃣ CHECK EXISTING SHIPPING INFO:');
  console.log('----------------------------------');
  console.log(`SELECT * FROM lats_shipping_info WHERE purchase_order_id = '0257aa6b-7f10-48fd-89c8-c776560725d1';`);

  console.log('\n💡 QUICK FIX OPTIONS:');
  console.log('======================');

  console.log('\n🔧 OPTION 1: If Carrier is missing');
  console.log('   - Create a new carrier or use an existing one');
  console.log('   - Check available carriers:');
  console.log('   SELECT id, name, code FROM lats_shipping_carriers LIMIT 5;');

  console.log('\n🔧 OPTION 2: If Manager is missing');
  console.log('   - Create a new manager or use an existing one');
  console.log('   - Check available managers:');
  console.log('   SELECT id, name, department FROM lats_shipping_managers LIMIT 5;');

  console.log('\n🔧 OPTION 3: If existing shipping info exists');
  console.log('   - Delete existing shipping info:');
  console.log('   DELETE FROM lats_shipping_info WHERE purchase_order_id = \'0257aa6b-7f10-48fd-89c8-c776560725d1\';');

  console.log('\n🚨 MOST LIKELY ISSUES:');
  console.log('======================');

  console.log('\n❌ Issue 1: Carrier Not Found');
  console.log('   - The carrier ID may be incorrect or the carrier was deleted');
  console.log('   - This is the most likely issue since carriers are often created separately');

  console.log('\n❌ Issue 2: Manager Not Found');
  console.log('   - The manager ID may be incorrect or the manager was deleted');
  console.log('   - Managers are often created separately from agents');

  console.log('\n❌ Issue 3: Existing Shipping Info Conflict');
  console.log('   - There may already be shipping info for this purchase order');
  console.log('   - The system is trying to create duplicate shipping info');

  console.log('\n✅ NEXT STEPS:');
  console.log('===============');
  console.log('1. Run the 2 remaining validation queries above');
  console.log('2. Identify which reference is missing (carrier or manager)');
  console.log('3. Either create the missing record or use an existing ID');
  console.log('4. Check for existing shipping info and delete if needed');
  console.log('5. Try the shipping assignment again');

  console.log('\n🔍 DEBUGGING TIP:');
  console.log('==================');
  console.log('Since agent and purchase order exist, the error is definitely caused by:');
  console.log('- Missing carrier (most likely)');
  console.log('- Missing manager (possible)');
  console.log('- Existing shipping info conflict (possible)');

  console.log('\n📋 QUICK REFERENCE:');
  console.log('===================');
  console.log('Carrier ID to check: 826320dc-7d7c-41a7-82d7-bd484c64c8ae');
  console.log('Manager ID to check: a15a9139-3be9-4028-b944-240caae9eeb2');
  console.log('Purchase Order ID: 0257aa6b-7f10-48fd-89c8-c776560725d1');
}

// Run the check
try {
  checkFinalReferences();
  console.log('\n✅ Final reference check complete!');
} catch (error) {
  console.error('❌ Final reference check failed:', error);
}
