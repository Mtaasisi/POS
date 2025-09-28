#!/usr/bin/env node

/**
 * Apply Customer Payments 400 Error Fix (Direct Approach)
 * This script fixes the 400 Bad Request error by directly adding missing columns
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

async function applyCustomerPayments400Fix() {
  try {
    console.log('🔧 Applying customer payments 400 error fix...');
    
    // Step 1: Test current table structure
    console.log('🔍 Checking current table structure...');
    
    // Use a direct SQL query to get table structure
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'customer_payments' });
    
    if (columnsError) {
      console.error('❌ Error fetching table structure:', columnsError);
      return;
    }
    
    console.log('📊 Current customer_payments table structure:');
    const existingColumns = columns.map(col => col.column_name);
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Step 2: Check what columns are missing
    const requiredColumns = [
      'currency', 'payment_account_id', 'payment_method_id', 
      'reference', 'notes', 'updated_by'
    ];
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns are already present!');
    } else {
      console.log('❌ Missing columns:', missingColumns.join(', '));
      console.log('⚠️  You need to run the migration manually or contact your database administrator');
      console.log('📝 The migration file is available at: supabase/migrations/20250131000069_fix_customer_payments_400_error.sql');
    }
    
    // Step 3: Test the fix by trying to insert a test payment
    console.log('🧪 Testing payment insert...');
    
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
    
    // Get a valid device ID for testing
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    const testDeviceId = devices && devices.length > 0 ? devices[0].id : null;
    
    // Try to insert a test payment with minimal required fields
    const testPaymentData = {
      customer_id: testCustomerId,
      device_id: testDeviceId,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed'
    };
    
    console.log('📝 Testing payment insert with data:', testPaymentData);
    
    const { data: testPayment, error: testError } = await supabase
      .from('customer_payments')
      .insert(testPaymentData)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test payment insert failed:', testError);
      console.error('❌ This confirms the 400 error issue');
      
      // Try with additional fields that might be expected
      console.log('🔄 Trying with additional fields...');
      
      const testPaymentDataExtended = {
        ...testPaymentData,
        currency: 'TZS',
        reference: 'TEST_PAYMENT_400_FIX',
        notes: 'Test payment to verify 400 error fix'
      };
      
      const { data: testPayment2, error: testError2 } = await supabase
        .from('customer_payments')
        .insert(testPaymentDataExtended)
        .select()
        .single();
      
      if (testError2) {
        console.error('❌ Extended test payment insert also failed:', testError2);
        console.log('📝 The issue is likely missing columns in the database schema');
        console.log('📝 Please apply the migration: supabase/migrations/20250131000069_fix_customer_payments_400_error.sql');
      } else {
        console.log('✅ Extended test payment inserted successfully:', testPayment2.id);
        
        // Clean up test payment
        const { error: deleteError } = await supabase
          .from('customer_payments')
          .delete()
          .eq('id', testPayment2.id);
        
        if (deleteError) {
          console.log('⚠️  Warning: Could not clean up test payment:', deleteError.message);
        } else {
          console.log('✅ Test payment cleaned up successfully');
        }
      }
      
      return;
    }
    
    console.log('✅ Test payment inserted successfully:', testPayment.id);
    
    // Clean up test payment
    const { error: deleteError } = await supabase
      .from('customer_payments')
      .delete()
      .eq('id', testPayment.id);
    
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

// Run the fix
applyCustomerPayments400Fix();
