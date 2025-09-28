#!/usr/bin/env node

/**
 * Apply Customer Payments 400 Error Fix
 * This script fixes the 400 Bad Request error by ensuring all required columns exist
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing Supabase service key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCustomerPayments400Fix() {
  try {
    console.log('🔧 Applying customer payments 400 error fix...');
    
    // Read the SQL fix file
    const fs = require('fs');
    const path = require('path');
    const sqlFilePath = path.join(__dirname, 'fix_customer_payments_400_error.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL fix file not found:', sqlFilePath);
      return;
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL fix
    console.log('📝 Executing SQL fix...');
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (sqlError) {
      console.error('❌ Error executing SQL fix:', sqlError);
      return;
    }
    
    console.log('✅ SQL fix executed successfully!');
    
    // Test the fix by trying to insert a test payment
    console.log('🧪 Testing the fix...');
    
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
      console.log('⚠️  No customers found for testing, but table structure should be fixed');
      return;
    }
    
    const testCustomerId = customers[0].id;
    
    // Get a valid device ID for testing
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('id')
      .limit(1);
    
    const testDeviceId = devices && devices.length > 0 ? devices[0].id : null;
    
    // Try to insert a test payment with all the new columns
    const testPaymentData = {
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
    
    console.log('📝 Testing payment insert with data:', testPaymentData);
    
    const { data: testPayment, error: testError } = await supabase
      .from('customer_payments')
      .insert(testPaymentData)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test payment insert failed:', testError);
      console.error('❌ The 400 error fix may not be complete');
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
    
    // Verify table structure
    console.log('🔍 Verifying table structure...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'customer_payments')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error fetching table structure:', columnsError);
      return;
    }
    
    console.log('📊 Customer payments table structure:');
    columns.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    console.log('\n🎉 Customer payments 400 error fix completed successfully!');
    console.log('✅ All required columns are now present');
    console.log('✅ 400 Bad Request errors should be resolved');
    console.log('✅ Your application should now be able to insert payments without errors');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
applyCustomerPayments400Fix();
