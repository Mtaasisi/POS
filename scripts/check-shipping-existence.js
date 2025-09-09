// Script to check if shipping record exists and diagnose "no rows returned" issue
// This script helps identify why shipping status updates are failing

function checkShippingExistence() {
  console.log('🔍 Checking Shipping Record Existence\n');
  console.log('=====================================\n');

  const shippingId = "e9264fb3-0724-49f8-bed2-4a9f1a2ce254";
  const purchaseOrderId = "0257aa6b-7f10-48fd-89c8-c776560725d1";

  console.log('📋 SHIPPING RECORD DETAILS:');
  console.log('============================');
  console.log(`Shipping ID: ${shippingId}`);
  console.log(`Purchase Order ID: ${purchaseOrderId}`);

  console.log('\n🔍 DIAGNOSTIC QUERIES:');
  console.log('=======================');

  console.log('\n1️⃣ CHECK IF SHIPPING RECORD EXISTS:');
  console.log('   SELECT id, status, tracking_number, created_at');
  console.log('   FROM lats_shipping_info');
  console.log(`   WHERE id = '${shippingId}';`);

  console.log('\n2️⃣ CHECK IF PURCHASE ORDER EXISTS:');
  console.log('   SELECT id, order_number, status, shipping_status');
  console.log('   FROM lats_purchase_orders');
  console.log(`   WHERE id = '${purchaseOrderId}';`);

  console.log('\n3️⃣ CHECK ALL SHIPPING RECORDS FOR THIS PO:');
  console.log('   SELECT id, status, tracking_number, created_at');
  console.log('   FROM lats_shipping_info');
  console.log(`   WHERE purchase_order_id = '${purchaseOrderId}';`);

  console.log('\n4️⃣ CHECK ALL SHIPPING RECORDS:');
  console.log('   SELECT id, purchase_order_id, status, tracking_number');
  console.log('   FROM lats_shipping_info');
  console.log('   ORDER BY created_at DESC LIMIT 10;');

  console.log('\n5️⃣ CHECK TRACKING EVENTS:');
  console.log('   SELECT id, shipping_id, status, description, created_at');
  console.log('   FROM lats_shipping_events');
  console.log(`   WHERE shipping_id = '${shippingId}';`);

  console.log('\n6️⃣ CHECK ALL TRACKING EVENTS:');
  console.log('   SELECT id, shipping_id, status, description, created_at');
  console.log('   FROM lats_shipping_events');
  console.log('   ORDER BY created_at DESC LIMIT 10;');

  console.log('\n🚨 POSSIBLE CAUSES OF "NO ROWS RETURNED":');
  console.log('==========================================');

  console.log('\n❌ CAUSE 1: Shipping Record Never Created');
  console.log('   Problem: The shipping record was never inserted into the database');
  console.log('   Symptoms: UPDATE returns 0 rows affected');
  console.log('   Solution: Create the shipping record first');

  console.log('\n❌ CAUSE 2: Wrong Shipping ID');
  console.log('   Problem: Using incorrect shipping ID in the update query');
  console.log('   Symptoms: No matching record found');
  console.log('   Solution: Verify the correct shipping ID');

  console.log('\n❌ CAUSE 3: Database Transaction Rollback');
  console.log('   Problem: Shipping creation failed and was rolled back');
  console.log('   Symptoms: Record appears to exist but actually doesn\'t');
  console.log('   Solution: Check database logs for rollback errors');

  console.log('\n❌ CAUSE 4: Table Name Mismatch');
  console.log('   Problem: Querying wrong table name');
  console.log('   Symptoms: Table doesn\'t exist or has different name');
  console.log('   Solution: Verify correct table name');

  console.log('\n❌ CAUSE 5: Database Connection Issue');
  console.log('   Problem: Not connected to the right database');
  console.log('   Symptoms: Queries return no results');
  console.log('   Solution: Check database connection and schema');

  console.log('\n🔧 SOLUTIONS:');
  console.log('==============');

  console.log('\n🔧 SOLUTION 1: Create Missing Shipping Record');
  console.log('   If the shipping record doesn\'t exist, create it:');
  console.log(`
   INSERT INTO lats_shipping_info (
     id, purchase_order_id, carrier_id, agent_id, manager_id,
     tracking_number, status, estimated_delivery, cost, notes
   ) VALUES (
     '${shippingId}',
     '${purchaseOrderId}',
     '826320dc-7d7c-41a7-82d7-bd484c64c8ae',
     'dd99d7ac-a27b-4488-912d-338bdaae25e9',
     'a15a9139-3be9-4028-b944-240caae9eeb2',
     'TRK51385845OCC5',
     'pending',
     '2025-10-06',
     288,
     'Shipment created and ready for pickup'
   );
   `);

  console.log('\n🔧 SOLUTION 2: Find Correct Shipping ID');
  console.log('   If using wrong ID, find the correct one:');
  console.log(`
   SELECT id, tracking_number, status, created_at
   FROM lats_shipping_info
   WHERE purchase_order_id = '${purchaseOrderId}'
   ORDER BY created_at DESC;
   `);

  console.log('\n🔧 SOLUTION 3: Check Application Logic');
  console.log('   Verify the shipping creation process:');
  console.log('   1. Check if createShippingInfo was called');
  console.log('   2. Verify the response was successful');
  console.log('   3. Check for any error handling that might prevent creation');

  console.log('\n🔧 SOLUTION 4: Test with Simple Insert');
  console.log('   Test if you can insert a new shipping record:');
  console.log(`
   INSERT INTO lats_shipping_info (
     purchase_order_id, carrier_id, tracking_number, status
   ) VALUES (
     '${purchaseOrderId}',
     '826320dc-7d7c-41a7-82d7-bd484c64c8ae',
     'TEST-TRACKING-123',
     'pending'
   ) RETURNING id;
   `);

  console.log('\n🔧 SOLUTION 5: Check Database Schema');
  console.log('   Verify the table structure:');
  console.log(`
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'lats_shipping_info'
   ORDER BY ordinal_position;
   `);

  console.log('\n📊 STEP-BY-STEP TROUBLESHOOTING:');
  console.log('==================================');
  console.log('1. Run the diagnostic queries above');
  console.log('2. Check if shipping record exists');
  console.log('3. If not exists, create it using SOLUTION 1');
  console.log('4. If exists, verify the ID is correct');
  console.log('5. Test status update with valid status');
  console.log('6. Check application logs for errors');
  console.log('7. Verify database connection and permissions');

  console.log('\n🎯 IMMEDIATE ACTIONS:');
  console.log('======================');
  console.log('1. Run: SELECT * FROM lats_shipping_info WHERE id = \'...\';');
  console.log('2. If no results, the record doesn\'t exist');
  console.log('3. Create the record using the INSERT statement above');
  console.log('4. Then try updating the status');
  console.log('5. Use only valid status values: pending, picked_up, in_transit, out_for_delivery, delivered, exception');

  console.log('\n💡 QUICK TEST:');
  console.log('===============');
  console.log('Try this simple test to verify everything works:');
  console.log(`
   -- Step 1: Check if record exists
   SELECT COUNT(*) FROM lats_shipping_info WHERE id = '${shippingId}';
   
   -- Step 2: If count is 0, create the record
   -- (Use the INSERT statement from SOLUTION 1)
   
   -- Step 3: Test status update
   UPDATE lats_shipping_info 
   SET status = 'pending' 
   WHERE id = '${shippingId}';
   
   -- Step 4: Verify update worked
   SELECT id, status FROM lats_shipping_info WHERE id = '${shippingId}';
   `);
}

// Run the check
try {
  checkShippingExistence();
  console.log('\n✅ Shipping existence check complete!');
  console.log('Run the diagnostic queries to identify the issue.');
} catch (error) {
  console.error('❌ Shipping existence check failed:', error);
}
