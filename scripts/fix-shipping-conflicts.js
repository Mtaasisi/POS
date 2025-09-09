// Comprehensive script to fix shipping assignment conflicts
// This script provides solutions for common shipping data issues

function fixShippingConflicts() {
  console.log('🔧 SHIPPING CONFLICT FIX SCRIPT');
  console.log('================================\n');

  const shippingData = {
    id: "e9264fb3-0724-49f8-bed2-4a9f1a2ce254",
    carrier: "DHL Express",
    carrierId: "826320dc-7d7c-41a7-82d7-bd484c64c8ae",
    trackingNumber: "TRK51385845OCC5",
    method: "Standard",
    cost: 288,
    agentId: "dd99d7ac-a27b-4488-912d-338bdaae25e9",
    managerId: "a15a9139-3be9-4028-b944-240caae9eeb2",
    status: "pending"
  };

  console.log('📋 SHIPPING DATA TO FIX:');
  console.log('========================');
  console.log(`Shipping ID: ${shippingData.id}`);
  console.log(`Carrier: ${shippingData.carrier}`);
  console.log(`Tracking Number: ${shippingData.trackingNumber}`);
  console.log(`Cost: ${shippingData.cost}`);
  console.log(`Status: ${shippingData.status}`);

  console.log('\n🔍 STEP 1: VALIDATION QUERIES');
  console.log('==============================');
  console.log('Run these queries to check for conflicts:');
  
  console.log('\n1️⃣ Check if shipping record already exists:');
  console.log(`SELECT * FROM lats_shipping_info WHERE id = '${shippingData.id}';`);
  
  console.log('\n2️⃣ Check for tracking number conflicts:');
  console.log(`SELECT * FROM lats_shipping_info WHERE tracking_number = '${shippingData.trackingNumber}' AND carrier_id = '${shippingData.carrierId}';`);
  
  console.log('\n3️⃣ Validate carrier exists:');
  console.log(`SELECT * FROM lats_shipping_carriers WHERE id = '${shippingData.carrierId}';`);
  
  console.log('\n4️⃣ Validate agent exists:');
  console.log(`SELECT * FROM lats_shipping_agents WHERE id = '${shippingData.agentId}';`);
  
  console.log('\n5️⃣ Validate manager exists:');
  console.log(`SELECT * FROM lats_shipping_managers WHERE id = '${shippingData.managerId}';`);

  console.log('\n🔧 STEP 2: FIX SOLUTIONS');
  console.log('=========================');

  console.log('\n🔧 SOLUTION A: If shipping record already exists');
  console.log('   Update the existing record instead of creating new:');
  console.log(`   UPDATE lats_shipping_info SET 
     tracking_number = '${shippingData.trackingNumber}',
     method = '${shippingData.method}',
     cost = ${shippingData.cost},
     status = '${shippingData.status}',
     updated_at = NOW()
   WHERE id = '${shippingData.id}';`);

  console.log('\n🔧 SOLUTION B: If tracking number conflict exists');
  console.log('   Generate a new unique tracking number:');
  const newTrackingNumber = generateTrackingNumber();
  console.log(`   New tracking number: ${newTrackingNumber}`);
  console.log(`   UPDATE lats_shipping_info SET tracking_number = '${newTrackingNumber}' WHERE id = '${shippingData.id}';`);

  console.log('\n🔧 SOLUTION C: If foreign key references don\'t exist');
  console.log('   Create missing records or use existing ones:');
  console.log('   -- Check if carrier exists, if not create:');
  console.log(`   INSERT INTO lats_shipping_carriers (id, name, is_active) 
     VALUES ('${shippingData.carrierId}', '${shippingData.carrier}', true) 
     ON CONFLICT (id) DO NOTHING;`);
  
  console.log('\n🔧 SOLUTION D: Clean up duplicate shipping records');
  console.log('   Remove duplicate shipping records for the same purchase order:');
  console.log('   DELETE FROM lats_shipping_info WHERE id IN (');
  console.log('     SELECT id FROM (');
  console.log('       SELECT id, ROW_NUMBER() OVER (');
  console.log('         PARTITION BY purchase_order_id ORDER BY created_at DESC');
  console.log('       ) as rn FROM lats_shipping_info');
  console.log('     ) t WHERE rn > 1');
  console.log('   );');

  console.log('\n🔧 SOLUTION E: Insert new shipping record (if all validations pass)');
  console.log('   INSERT INTO lats_shipping_info (');
  console.log('     id, purchase_order_id, carrier_id, tracking_number,');
  console.log('     method, cost, agent_id, manager_id, status, created_at');
  console.log('   ) VALUES (');
  console.log(`     '${shippingData.id}',`);
  console.log('     \'YOUR_PURCHASE_ORDER_ID_HERE\', -- ⚠️ REPLACE WITH ACTUAL PO ID');
  console.log(`     '${shippingData.carrierId}',`);
  console.log(`     '${shippingData.trackingNumber}',`);
  console.log(`     '${shippingData.method}',`);
  console.log(`     ${shippingData.cost},`);
  console.log(`     '${shippingData.agentId}',`);
  console.log(`     '${shippingData.managerId}',`);
  console.log(`     '${shippingData.status}',`);
  console.log('     NOW()');
  console.log('   );');

  console.log('\n🎯 STEP 3: APPLICATION LOGIC FIXES');
  console.log('===================================');
  console.log('Update your shippingDataService to:');
  console.log('1. Check if shipping record exists before creating');
  console.log('2. Use UPSERT (INSERT ... ON CONFLICT) instead of INSERT');
  console.log('3. Generate unique tracking numbers automatically');
  console.log('4. Validate all foreign key references before insert');
  console.log('5. Handle duplicate purchase order shipping gracefully');

  console.log('\n📊 STEP 4: DATABASE SCHEMA IMPROVEMENTS');
  console.log('=======================================');
  console.log('Consider adding these constraints:');
  console.log('1. Unique constraint on purchase_order_id:');
  console.log('   ALTER TABLE lats_shipping_info ADD CONSTRAINT unique_po_shipping UNIQUE (purchase_order_id);');
  console.log('2. Check constraint on cost:');
  console.log('   ALTER TABLE lats_shipping_info ADD CONSTRAINT check_positive_cost CHECK (cost > 0);');
  console.log('3. Index on tracking_number for faster lookups:');
  console.log('   CREATE INDEX idx_shipping_tracking ON lats_shipping_info(tracking_number);');

  console.log('\n🚨 IMMEDIATE ACTION PLAN');
  console.log('========================');
  console.log('1. Run validation queries (Step 1)');
  console.log('2. Apply appropriate fix solution (Step 2)');
  console.log('3. Update application code (Step 3)');
  console.log('4. Consider schema improvements (Step 4)');
  console.log('5. Test the fix thoroughly');

  console.log('\n✅ Fix script complete!');
}

function generateTrackingNumber() {
  const prefix = 'TRK';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Run the fix script
try {
  fixShippingConflicts();
} catch (error) {
  console.error('❌ Fix script failed:', error);
}
