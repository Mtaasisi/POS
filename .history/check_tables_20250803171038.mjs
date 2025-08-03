#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    // List of tables to check
    const tablesToCheck = [
      'payment_methods',
      'payment_method_accounts',
      'payment_methods_accounts', // Check if old name exists
      'finance_accounts',
      'sales_orders',
      'finance_expenses',
      'installment_payments'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: EXISTS`);
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log('\n🔍 Checking specific payment method tables...\n');
    
    // Check payment_methods table structure
    try {
      const { data: methods, error: methodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .limit(5);
      
      if (methodsError) {
        console.log('❌ payment_methods table error:', methodsError.message);
      } else {
        console.log(`✅ payment_methods table: ${methods?.length || 0} records found`);
        if (methods && methods.length > 0) {
          console.log('Sample record:', methods[0]);
        }
      }
    } catch (err) {
      console.log('❌ Error checking payment_methods:', err.message);
    }
    
    // Check payment_method_accounts table structure
    try {
      const { data: accounts, error: accountsError } = await supabase
        .from('payment_method_accounts')
        .select('*')
        .limit(5);
      
      if (accountsError) {
        console.log('❌ payment_method_accounts table error:', accountsError.message);
      } else {
        console.log(`✅ payment_method_accounts table: ${accounts?.length || 0} records found`);
        if (accounts && accounts.length > 0) {
          console.log('Sample record:', accounts[0]);
        }
      }
    } catch (err) {
      console.log('❌ Error checking payment_method_accounts:', err.message);
    }
    
    // Check if old table name exists
    try {
      const { data: oldTable, error: oldTableError } = await supabase
        .from('payment_methods_accounts')
        .select('*')
        .limit(1);
      
      if (oldTableError) {
        console.log('✅ payment_methods_accounts table does NOT exist (this is correct)');
      } else {
        console.log('⚠️  payment_methods_accounts table EXISTS (this might be the issue)');
        console.log('Sample record:', oldTable?.[0]);
      }
    } catch (err) {
      console.log('✅ payment_methods_accounts table does NOT exist (this is correct)');
    }
    
    console.log('\n📋 Summary:');
    console.log('- payment_methods: Should exist');
    console.log('- payment_method_accounts: Should exist');
    console.log('- payment_methods_accounts: Should NOT exist');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Run the check
checkTables(); 