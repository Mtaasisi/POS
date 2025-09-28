#!/usr/bin/env node

/**
 * Debug the specific 400 error for customer_payments
 * This script tries to reproduce the exact error scenario
 */

import { createClient } from '@supabase/supabase-js';

// Use the credentials from the existing scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPaymentError() {
  try {
    console.log('🐛 Debugging customer_payments 400 error...');
    
    // Try to reproduce the exact error from the log
    const paymentId = '01b26848-e830-4305-b332-7498d7f73fef';
    
    console.log(`🔍 Testing with payment ID: ${paymentId}`);
    
    // First, check if this payment exists
    const { data: existingPayment, error: fetchError } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    
    if (fetchError) {
      console.log(`❌ Payment not found: ${fetchError.message}`);
      
      // Let's try with a real payment ID
      const { data: realPayments, error: realFetchError } = await supabase
        .from('customer_payments')
        .select('id, amount, method, status')
        .limit(1);
      
      if (realFetchError) {
        console.error('❌ Error fetching real payments:', realFetchError.message);
        return;
      }
      
      if (realPayments && realPayments.length > 0) {
        const realPayment = realPayments[0];
        console.log(`📋 Using real payment ID: ${realPayment.id}`);
        
        // Test the exact update that might be failing
        console.log('\n🧪 Testing potential problematic update...');
        
        // Test with potentially problematic data
        const problematicUpdates = [
          {
            name: 'Null amount',
            data: { amount: null, updated_at: new Date().toISOString() }
          },
          {
            name: 'Empty string amount',
            data: { amount: '', updated_at: new Date().toISOString() }
          },
          {
            name: 'Negative amount',
            data: { amount: -100, updated_at: new Date().toISOString() }
          },
          {
            name: 'Very large amount',
            data: { amount: 999999999999999, updated_at: new Date().toISOString() }
          },
          {
            name: 'Null method',
            data: { method: null, updated_at: new Date().toISOString() }
          },
          {
            name: 'Empty string method',
            data: { method: '', updated_at: new Date().toISOString() }
          },
          {
            name: 'Null status',
            data: { status: null, updated_at: new Date().toISOString() }
          },
          {
            name: 'Empty string status',
            data: { status: '', updated_at: new Date().toISOString() }
          },
          {
            name: 'Invalid timestamp format',
            data: { updated_at: 'invalid-date' }
          },
          {
            name: 'Null timestamp',
            data: { updated_at: null }
          }
        ];
        
        for (const test of problematicUpdates) {
          try {
            console.log(`   Testing: ${test.name}...`);
            const { error } = await supabase
              .from('customer_payments')
              .update(test.data)
              .eq('id', realPayment.id);
            
            if (error) {
              console.log(`   ❌ ${test.name}: ${error.message}`);
            } else {
              console.log(`   ✅ ${test.name}: accepted`);
            }
          } catch (err) {
            console.log(`   ❌ ${test.name}: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Payment found:', existingPayment);
      
      // Test update with the existing payment
      console.log('\n🧪 Testing update with existing payment...');
      const { error: updateError } = await supabase
        .from('customer_payments')
        .update({ 
          amount: existingPayment.amount,
          method: existingPayment.method,
          status: existingPayment.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);
      
      if (updateError) {
        console.log(`❌ Update failed: ${updateError.message}`);
      } else {
        console.log('✅ Update successful');
      }
    }
    
    // Test RLS policies
    console.log('\n🔍 Testing RLS policies...');
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from('customer_payments')
        .select('id')
        .limit(1);
      
      if (rlsError) {
        console.log(`❌ RLS test failed: ${rlsError.message}`);
      } else {
        console.log('✅ RLS policies allow access');
      }
    } catch (err) {
      console.log(`❌ RLS test error: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugPaymentError();
