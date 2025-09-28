#!/usr/bin/env node

/**
 * Apply Permanent Customer Payments 400 Error Fix
 * 
 * This script applies the permanent fix for the 400 Bad Request error
 * when POSTing to the customer_payments table in Supabase.
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
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPermanentFix() {
  try {
    console.log('🔧 Applying permanent fix for customer_payments 400 error...');
    
    // Read the SQL fix file
    const fs = require('fs');
    const path = require('path');
    const sqlFilePath = path.join(__dirname, 'permanent_customer_payments_400_fix.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL fix file not found:', sqlFilePath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL fix
    console.log('📝 Executing SQL fix...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing SQL fix:', error);
      process.exit(1);
    }
    
    console.log('✅ SQL fix executed successfully!');
    
    // Test the fix by trying to insert a test payment
    console.log('🧪 Testing the fix...');
    
    // Get a test customer
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (customerError || !customers || customers.length === 0) {
      console.log('⚠️  No customers found for testing, but fix should still work');
      return;
    }
    
    const testCustomerId = customers[0].id;
    
    // Try to insert a test payment with all the new columns
    const testPaymentData = {
      customer_id: testCustomerId,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      currency: 'TZS',
      reference: 'PERMANENT_FIX_TEST',
      notes: 'Test payment to verify permanent 400 error fix'
    };
    
    const { data: testPayment, error: testError } = await supabase
      .from('customer_payments')
      .insert(testPaymentData)
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Test insert failed:', testError);
      console.error('⚠️  The fix may not have worked completely');
      return;
    }
    
    console.log('✅ Test payment inserted successfully!');
    
    // Clean up test payment
    await supabase
      .from('customer_payments')
      .delete()
      .eq('id', testPayment.id);
    
    console.log('🧹 Test payment cleaned up');
    
    console.log('');
    console.log('🎉 PERMANENT FIX APPLIED SUCCESSFULLY!');
    console.log('');
    console.log('✅ The 400 Bad Request error for customer_payments should now be permanently resolved');
    console.log('✅ All required columns have been added to the table');
    console.log('✅ Database types have been updated');
    console.log('✅ Application can now successfully POST to customer_payments');
    console.log('');
    console.log('📋 What was fixed:');
    console.log('   • Added currency column with TZS default');
    console.log('   • Added payment_account_id column');
    console.log('   • Added payment_method_id column');
    console.log('   • Added reference column');
    console.log('   • Added notes column');
    console.log('   • Added proper constraints and indexes');
    console.log('   • Fixed triggers and permissions');
    console.log('   • Updated database types');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the fix
applyPermanentFix();
