#!/usr/bin/env node

/**
 * Check payment table constraints to identify valid values
 * This script checks what constraints exist on the customer_payments table
 */

import { createClient } from '@supabase/supabase-js';

// Use the credentials from the existing scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
  try {
    console.log('🔍 Checking customer_payments table constraints...');
    
    // Test different method values
    console.log('\n🧪 Testing method values...');
    const methodValues = ['cash', 'card', 'transfer', 'mobile_money', 'bank_transfer', 'invalid_method'];
    
    for (const method of methodValues) {
      try {
        const { error } = await supabase
          .from('customer_payments')
          .update({ method: method })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // dummy UUID
        
        if (error) {
          if (error.message.includes('check constraint')) {
            console.log(`   ❌ Method '${method}': ${error.message}`);
          } else {
            console.log(`   ⚠️  Method '${method}': ${error.message}`);
          }
        } else {
          console.log(`   ✅ Method '${method}': valid`);
        }
      } catch (err) {
        console.log(`   ❌ Method '${method}': ${err.message}`);
      }
    }
    
    // Test different status values
    console.log('\n🧪 Testing status values...');
    const statusValues = ['completed', 'pending', 'failed', 'approved', 'cancelled', 'invalid_status'];
    
    for (const status of statusValues) {
      try {
        const { error } = await supabase
          .from('customer_payments')
          .update({ status: status })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // dummy UUID
        
        if (error) {
          if (error.message.includes('check constraint')) {
            console.log(`   ❌ Status '${status}': ${error.message}`);
          } else {
            console.log(`   ⚠️  Status '${status}': ${error.message}`);
          }
        } else {
          console.log(`   ✅ Status '${status}': valid`);
        }
      } catch (err) {
        console.log(`   ❌ Status '${status}': ${err.message}`);
      }
    }
    
    // Test different payment_type values
    console.log('\n🧪 Testing payment_type values...');
    const paymentTypeValues = ['payment', 'deposit', 'refund', 'invalid_type'];
    
    for (const paymentType of paymentTypeValues) {
      try {
        const { error } = await supabase
          .from('customer_payments')
          .update({ payment_type: paymentType })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // dummy UUID
        
        if (error) {
          if (error.message.includes('check constraint')) {
            console.log(`   ❌ Payment Type '${paymentType}': ${error.message}`);
          } else {
            console.log(`   ⚠️  Payment Type '${paymentType}': ${error.message}`);
          }
        } else {
          console.log(`   ✅ Payment Type '${paymentType}': valid`);
        }
      } catch (err) {
        console.log(`   ❌ Payment Type '${paymentType}': ${err.message}`);
      }
    }
    
    // Test currency values
    console.log('\n🧪 Testing currency values...');
    const currencyValues = ['TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY', 'INVALID'];
    
    for (const currency of currencyValues) {
      try {
        const { error } = await supabase
          .from('customer_payments')
          .update({ currency: currency })
          .eq('id', '00000000-0000-0000-0000-000000000000'); // dummy UUID
        
        if (error) {
          if (error.message.includes('check constraint')) {
            console.log(`   ❌ Currency '${currency}': ${error.message}`);
          } else {
            console.log(`   ⚠️  Currency '${currency}': ${error.message}`);
          }
        } else {
          console.log(`   ✅ Currency '${currency}': valid`);
        }
      } catch (err) {
        console.log(`   ❌ Currency '${currency}': ${err.message}`);
      }
    }
    
    console.log('\n🎉 Constraint tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkConstraints();
