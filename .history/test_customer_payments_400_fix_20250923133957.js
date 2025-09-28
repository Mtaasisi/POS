#!/usr/bin/env node

/**
 * Test Customer Payments 400 Error Fix
 * This script tests if the 400 Bad Request error is resolved
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or defaults
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCustomerPayments400Fix() {
  try {
    console.log('🧪 Testing customer payments 400 error fix...');
    
    // Step 1: Get test data
    console.log('📝 Getting test data...');
    
    // Get a valid customer ID for testing
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (customerError) {
      console.error('❌ Error fetching customers:', customerError);
      return;
    }
    
    if (!customers || customers.length === 0) {
      console.log('⚠️  No customers found for testing');
      return;
    }
    
    const testCustomerId = customers[0].id;
    console.log('✅ Found test customer:', testCustomerId);
    
    // Get a valid device ID for testing
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    const testDeviceId = devices && devices.length > 0 ? devices[0].id : null;
    if (testDeviceId) {
      console.log('✅ Found test device:', testDeviceId);
    } else {
      console.log('⚠️  No devices found, testing without device_id');
    }
    
    // Step 2: Test basic payment insertion
    console.log('🧪 Testing basic payment insertion...');
    
    const basicPaymentData = {
      customer_id: testCustomerId,
      device_id: testDeviceId,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed'
    };
    
    console.log('📝 Testing with basic data:', basicPaymentData);
    
    const { data: basicPayment, error: basicError } = await supabase
      .from('customer_payments')
      .insert(basicPaymentData)
      .select()
      .single();
    
    if (basicError) {
      console.error('❌ Basic payment insert failed:', basicError);
      console.log('🔍 This indicates the 400 error is still present');
      
      // Step 3: Try with extended data
      console.log('🔄 Trying with extended data...');
      
      const extendedPaymentData = {
        customer_id: testCustomerId,
        device_id: testDeviceId,
        amount: 100.00,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed',
        currency: 'TZS',
        reference: 'TEST_PAYMENT_400_FIX',
        notes: 'Test payment to verify 400 error fix'
      };
      
      console.log('📝 Testing with extended data:', extendedPaymentData);
      
      const { data: extendedPayment, error: extendedError } = await supabase
        .from('customer_payments')
        .insert(extendedPaymentData)
        .select()
        .single();
      
      if (extendedError) {
        console.error('❌ Extended payment insert also failed:', extendedError);
        console.log('📝 The issue is likely missing columns in the database schema');
        console.log('📝 Please apply the migration: supabase/migrations/20250131000069_fix_customer_payments_400_error.sql');
        console.log('📝 Or run the SQL commands manually in your Supabase dashboard');
        
        // Show the specific error details
        if (extendedError.message) {
          console.log('🔍 Error details:', extendedError.message);
        }
        if (extendedError.details) {
          console.log('🔍 Error details:', extendedError.details);
        }
        if (extendedError.hint) {
          console.log('🔍 Error hint:', extendedError.hint);
        }
        
        return;
      } else {
        console.log('✅ Extended payment inserted successfully:', extendedPayment.id);
        
        // Clean up test payment
        const { error: deleteError } = await supabase
          .from('customer_payments')
          .delete()
          .eq('id', extendedPayment.id);
        
        if (deleteError) {
          console.log('⚠️  Warning: Could not clean up test payment:', deleteError.message);
        } else {
          console.log('✅ Test payment cleaned up successfully');
        }
        
        console.log('🎉 The 400 error is resolved with extended data!');
        console.log('✅ Your application should include the additional fields when inserting payments');
        return;
      }
    }
    
    console.log('✅ Basic payment inserted successfully:', basicPayment.id);
    
    // Clean up test payment
    const { error: deleteError } = await supabase
      .from('customer_payments')
      .delete()
      .eq('id', basicPayment.id);
    
    if (deleteError) {
      console.log('⚠️  Warning: Could not clean up test payment:', deleteError.message);
    } else {
      console.log('✅ Test payment cleaned up successfully');
    }
    
    console.log('\n🎉 Customer payments table is working correctly!');
    console.log('✅ No 400 errors detected');
    console.log('✅ Your application should be able to insert payments without issues');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testCustomerPayments400Fix();
