#!/usr/bin/env node

/**
 * Check customer_payments table structure
 * This script verifies what columns exist in the customer_payments table
 */

import { createClient } from '@supabase/supabase-js';

// Use the credentials from the existing scripts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  try {
    console.log('🔍 Checking customer_payments table structure...');
    
    // Try to get table information using a simple query
    const { data, error } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Table structure (from sample record):');
      const columns = Object.keys(data[0]);
      columns.forEach((column, index) => {
        console.log(`   ${index + 1}. ${column}`);
      });
    } else {
      console.log('⚠️  No records found in customer_payments table');
    }
    
    // Test specific columns that might be missing
    console.log('\n🔍 Testing specific columns...');
    
    const testColumns = [
      'currency',
      'payment_account_id', 
      'payment_method_id',
      'reference',
      'notes',
      'updated_by'
    ];
    
    for (const column of testColumns) {
      try {
        const { data, error } = await supabase
          .from('customer_payments')
          .select(column)
          .limit(1);
        
        if (error) {
          console.log(`   ❌ Column '${column}': ${error.message}`);
        } else {
          console.log(`   ✅ Column '${column}': exists`);
        }
      } catch (err) {
        console.log(`   ❌ Column '${column}': ${err.message}`);
      }
    }
    
    // Test a simple update to see if it works
    console.log('\n🔍 Testing update capability...');
    try {
      const { error: updateError } = await supabase
        .from('customer_payments')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', '00000000-0000-0000-0000-000000000000'); // dummy UUID
      
      if (updateError) {
        if (updateError.message.includes('No rows found')) {
          console.log('   ✅ Update capability: working (no matching record found, which is expected)');
        } else {
          console.log(`   ⚠️  Update test: ${updateError.message}`);
        }
      } else {
        console.log('   ✅ Update capability: working');
      }
    } catch (err) {
      console.log(`   ❌ Update test error: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkTableStructure();
