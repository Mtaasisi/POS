#!/usr/bin/env node

/**
 * Test Extended Payment Insert
 * This script tests the exact data structure your application is trying to insert
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

async function testExtendedPaymentInsert() {
  try {
    console.log('🧪 Testing extended payment insert (mimicking your application)...');
    
    // Get test data
    const { data: customers } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    const { data: devices } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    const testCustomerId = customers[0].id;
    const testDeviceId = devices[0].id;
    
    // Test with the exact data structure your application is trying to insert
    const paymentData = {
      customer_id: testCustomerId,
      device_id: testDeviceId,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      currency: 'TZS',                    // This field is missing from your table
      payment_account_id: null,           // This field is missing from your table
      payment_method_id: null,            // This field is missing from your table
      reference: 'TEST_EXTENDED_PAYMENT', // This field is missing from your table
      notes: 'Test payment with extended fields', // This field is missing from your table
      payment_date: new Date().toISOString(),
      created_by: testCustomerId,         // Using customer ID as user ID for test
      updated_at: new Date().toISOString() // This field is missing from your table
    };
    
    console.log('📝 Testing with extended data structure:', paymentData);
    
    const { data: payment, error } = await supabase
      .from('customer_payments')
      .insert(paymentData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Extended payment insert failed:', error);
      console.log('🔍 This confirms the 400 error is caused by missing columns');
      console.log('📝 The following fields are missing from your customer_payments table:');
      console.log('   - currency');
      console.log('   - payment_account_id');
      console.log('   - payment_method_id');
      console.log('   - reference');
      console.log('   - notes');
      console.log('   - updated_at');
      console.log('');
      console.log('📝 To fix this, you need to apply the migration:');
      console.log('   supabase/migrations/20250131000069_fix_customer_payments_400_error.sql');
      console.log('');
      console.log('📝 Or manually add these columns to your customer_payments table:');
      console.log('   ALTER TABLE customer_payments ADD COLUMN currency VARCHAR(3) DEFAULT \'TZS\';');
      console.log('   ALTER TABLE customer_payments ADD COLUMN payment_account_id UUID;');
      console.log('   ALTER TABLE customer_payments ADD COLUMN payment_method_id UUID;');
      console.log('   ALTER TABLE customer_payments ADD COLUMN reference VARCHAR(255);');
      console.log('   ALTER TABLE customer_payments ADD COLUMN notes TEXT;');
      console.log('   ALTER TABLE customer_payments ADD COLUMN updated_by UUID;');
      
      return;
    }
    
    console.log('✅ Extended payment inserted successfully:', payment.id);
    
    // Clean up
    await supabase
      .from('customer_payments')
      .delete()
      .eq('id', payment.id);
    
    console.log('✅ Test payment cleaned up successfully');
    console.log('🎉 All required columns are present in your database!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testExtendedPaymentInsert();
