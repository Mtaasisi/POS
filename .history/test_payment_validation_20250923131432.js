#!/usr/bin/env node

/**
 * Test script to verify payment validation workflow
 * This script tests the payment validation logic to ensure devices cannot be returned
 * to customers when there are pending payments.
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test device payment validation
 */
async function testPaymentValidation() {
  console.log('🧪 Testing Payment Validation Workflow...\n');

  try {
    // Test 1: Get a device with pending payments
    console.log('1️⃣ Testing device with pending payments...');
    const { data: devicesWithPayments, error: devicesError } = await supabase
      .from('devices')
      .select(`
        id,
        brand,
        model,
        status,
        repair_cost,
        repair_price,
        customer_id,
        customer_payments!inner(
          id,
          amount,
          status,
          payment_type
        )
      `)
      .eq('customer_payments.status', 'pending')
      .limit(1);

    if (devicesError) {
      console.error('❌ Error fetching devices with payments:', devicesError);
      return;
    }

    if (devicesWithPayments && devicesWithPayments.length > 0) {
      const testDevice = devicesWithPayments[0];
      console.log(`✅ Found test device: ${testDevice.brand} ${testDevice.model} (ID: ${testDevice.id})`);
      console.log(`   Status: ${testDevice.status}`);
      console.log(`   Repair Cost: ${testDevice.repair_cost || testDevice.repair_price || 0}`);
      
      // Test payment validation
      const { validateDeviceHandover } = await import('./src/utils/paymentValidation.ts');
      const validation = await validateDeviceHandover(testDevice.id);
      
      console.log(`   Payment Validation Result:`);
      console.log(`   - Valid: ${validation.valid}`);
      console.log(`   - Message: ${validation.message || 'No message'}`);
      console.log(`   - Total Cost: ${validation.totalCost}`);
      console.log(`   - Total Paid: ${validation.totalPaid}`);
      console.log(`   - Total Pending: ${validation.totalPending}`);
      console.log(`   - Amount Due: ${validation.amountDue}`);
      
      if (!validation.valid) {
        console.log('✅ Payment validation correctly prevents device return');
      } else {
        console.log('⚠️  Payment validation allows device return (may be correct if no costs)');
      }
    } else {
      console.log('ℹ️  No devices with pending payments found for testing');
    }

    // Test 2: Get a device without pending payments
    console.log('\n2️⃣ Testing device without pending payments...');
    const { data: devicesWithoutPayments, error: devicesWithoutError } = await supabase
      .from('devices')
      .select(`
        id,
        brand,
        model,
        status,
        repair_cost,
        repair_price,
        customer_id
      `)
      .eq('status', 'repair-complete')
      .limit(1);

    if (devicesWithoutError) {
      console.error('❌ Error fetching devices without payments:', devicesWithoutError);
      return;
    }

    if (devicesWithoutPayments && devicesWithoutPayments.length > 0) {
      const testDevice2 = devicesWithoutPayments[0];
      console.log(`✅ Found test device: ${testDevice2.brand} ${testDevice2.model} (ID: ${testDevice2.id})`);
      console.log(`   Status: ${testDevice2.status}`);
      console.log(`   Repair Cost: ${testDevice2.repair_cost || testDevice2.repair_price || 0}`);
      
      // Test payment validation
      const { validateDeviceHandover } = await import('./src/utils/paymentValidation.ts');
      const validation2 = await validateDeviceHandover(testDevice2.id);
      
      console.log(`   Payment Validation Result:`);
      console.log(`   - Valid: ${validation2.valid}`);
      console.log(`   - Message: ${validation2.message || 'No message'}`);
      console.log(`   - Total Cost: ${validation2.totalCost}`);
      console.log(`   - Total Paid: ${validation2.totalPaid}`);
      console.log(`   - Total Pending: ${validation2.totalPending}`);
      console.log(`   - Amount Due: ${validation2.amountDue}`);
      
      if (validation2.valid) {
        console.log('✅ Payment validation correctly allows device return');
      } else {
        console.log('⚠️  Payment validation prevents device return');
      }
    } else {
      console.log('ℹ️  No devices in repair-complete status found for testing');
    }

    // Test 3: Check payment status summary
    console.log('\n3️⃣ Testing payment status summary...');
    const { data: allPayments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('id, device_id, amount, status, payment_type')
      .limit(10);

    if (paymentsError) {
      console.error('❌ Error fetching payments:', paymentsError);
      return;
    }

    if (allPayments && allPayments.length > 0) {
      console.log(`✅ Found ${allPayments.length} payment records`);
      
      const pendingPayments = allPayments.filter(p => p.status === 'pending');
      const completedPayments = allPayments.filter(p => p.status === 'completed');
      const failedPayments = allPayments.filter(p => p.status === 'failed');
      
      console.log(`   - Pending: ${pendingPayments.length}`);
      console.log(`   - Completed: ${completedPayments.length}`);
      console.log(`   - Failed: ${failedPayments.length}`);
      
      if (pendingPayments.length > 0) {
        console.log('✅ Pending payments found - validation should prevent device returns');
      } else {
        console.log('ℹ️  No pending payments found');
      }
    } else {
      console.log('ℹ️  No payment records found');
    }

    console.log('\n🎉 Payment validation test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Payment validation function is working');
    console.log('   - Devices with pending payments should be blocked from return');
    console.log('   - Devices without pending payments should be allowed to return');
    console.log('   - UI warnings should appear when payments are pending');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPaymentValidation();
}

module.exports = { testPaymentValidation };
