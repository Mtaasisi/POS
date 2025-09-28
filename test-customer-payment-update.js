#!/usr/bin/env node

/**
 * Test customer_payment update to identify 400 error cause
 * This script tests various update scenarios to find the issue
 */

import { createClient } from '@supabase/supabase-js';

// Use the credentials from the existing scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentUpdate() {
  try {
    console.log('🧪 Testing customer_payment update scenarios...');
    
    // First, let's get a real payment record to test with
    const { data: payments, error: fetchError } = await supabase
      .from('customer_payments')
      .select('id, amount, method, status, currency')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error fetching payments:', fetchError.message);
      return;
    }
    
    if (!payments || payments.length === 0) {
      console.log('⚠️  No payment records found to test with');
      return;
    }
    
    const testPayment = payments[0];
    console.log(`📋 Testing with payment ID: ${testPayment.id}`);
    console.log(`   Current amount: ${testPayment.amount}`);
    console.log(`   Current method: ${testPayment.method}`);
    console.log(`   Current status: ${testPayment.status}`);
    console.log(`   Current currency: ${testPayment.currency}`);
    
    // Test 1: Simple amount update
    console.log('\n🧪 Test 1: Simple amount update...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          amount: testPayment.amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ❌ Amount update failed: ${error.message}`);
      } else {
        console.log('   ✅ Amount update successful');
      }
    } catch (err) {
      console.log(`   ❌ Amount update error: ${err.message}`);
    }
    
    // Test 2: Method update
    console.log('\n🧪 Test 2: Method update...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          method: 'cash',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ❌ Method update failed: ${error.message}`);
      } else {
        console.log('   ✅ Method update successful');
      }
    } catch (err) {
      console.log(`   ❌ Method update error: ${err.message}`);
    }
    
    // Test 3: Status update
    console.log('\n🧪 Test 3: Status update...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ❌ Status update failed: ${error.message}`);
      } else {
        console.log('   ✅ Status update successful');
      }
    } catch (err) {
      console.log(`   ❌ Status update error: ${err.message}`);
    }
    
    // Test 4: Currency update
    console.log('\n🧪 Test 4: Currency update...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          currency: 'TZS',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ❌ Currency update failed: ${error.message}`);
      } else {
        console.log('   ✅ Currency update successful');
      }
    } catch (err) {
      console.log(`   ❌ Currency update error: ${err.message}`);
    }
    
    // Test 5: Multiple field update (like the frontend might do)
    console.log('\n🧪 Test 5: Multiple field update...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          amount: testPayment.amount,
          method: 'cash',
          status: 'completed',
          currency: 'TZS',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ❌ Multiple field update failed: ${error.message}`);
      } else {
        console.log('   ✅ Multiple field update successful');
      }
    } catch (err) {
      console.log(`   ❌ Multiple field update error: ${err.message}`);
    }
    
    // Test 6: Invalid data types
    console.log('\n🧪 Test 6: Invalid data types...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          amount: 'invalid_amount',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ✅ Invalid amount correctly rejected: ${error.message}`);
      } else {
        console.log('   ⚠️  Invalid amount was accepted (unexpected)');
      }
    } catch (err) {
      console.log(`   ✅ Invalid amount correctly rejected: ${err.message}`);
    }
    
    // Test 7: Invalid status value
    console.log('\n🧪 Test 7: Invalid status value...');
    try {
      const { error } = await supabase
        .from('customer_payments')
        .update({ 
          status: 'invalid_status',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPayment.id);
      
      if (error) {
        console.log(`   ✅ Invalid status correctly rejected: ${error.message}`);
      } else {
        console.log('   ⚠️  Invalid status was accepted (unexpected)');
      }
    } catch (err) {
      console.log(`   ✅ Invalid status correctly rejected: ${err.message}`);
    }
    
    console.log('\n🎉 Payment update tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPaymentUpdate();
