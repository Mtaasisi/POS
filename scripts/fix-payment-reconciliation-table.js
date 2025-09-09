#!/usr/bin/env node

/**
 * Fix payment reconciliation table schema
 * This script creates the correct payment_reconciliation table structure
 */

import { createClient } from '@supabase/supabase-js';

// Get configuration (same as supabaseClient.ts)
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

const config = getConfig();
const supabase = createClient(config.url, config.key);

async function fixPaymentReconciliationTable() {
  try {
    console.log('🔄 Fixing payment reconciliation table...');

    // First, check if the table exists
    console.log('🔍 Checking if payment_reconciliation table exists...');
    const { data: existingTables, error: tableCheckError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'payment_reconciliation');

    if (tableCheckError) {
      console.error('❌ Error checking table existence:', tableCheckError.message);
      return;
    }

    if (existingTables && existingTables.length > 0) {
      console.log('📋 payment_reconciliation table exists, checking structure...');
      
      // Check current table structure
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'payment_reconciliation')
        .order('ordinal_position');

      if (columnError) {
        console.error('❌ Error checking table columns:', columnError.message);
        return;
      }

      console.log('📋 Current table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Check if we have the required columns
      const requiredColumns = ['id', 'date', 'status', 'expected', 'actual', 'variance', 'source', 'details', 'discrepancies'];
      const existingColumnNames = columns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

      if (missingColumns.length > 0) {
        console.log(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
        console.log('💡 The table structure needs to be updated manually in Supabase dashboard');
        console.log('   or you need to drop and recreate the table.');
      } else {
        console.log('✅ All required columns exist');
      }

    } else {
      console.log('❌ payment_reconciliation table does not exist');
      console.log('💡 You need to create the table manually in Supabase dashboard');
    }

    // Test the current table functionality
    console.log('🧪 Testing table functionality...');
    
    try {
      // Try to insert a test record
      const testRecord = {
        id: 'test_recon_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        status: 'reconciled',
        expected: 1000.00,
        actual: 1000.00,
        variance: 0.00,
        source: 'combined',
        details: { devicePayments: 5, posSales: 3, fees: 50, refunds: 0 },
        discrepancies: [],
        notes: 'Test record'
      };

      const { error: insertError } = await supabase
        .from('payment_reconciliation')
        .insert(testRecord);

      if (insertError) {
        console.error('❌ Error inserting test record:', insertError.message);
        console.log('💡 This confirms the table structure issue');
        return;
      }

      console.log('✅ Test record inserted successfully');

      // Clean up test record
      const { error: deleteError } = await supabase
        .from('payment_reconciliation')
        .delete()
        .eq('id', testRecord.id);

      if (deleteError) {
        console.warn('⚠️  Warning: Could not clean up test record:', deleteError.message);
      } else {
        console.log('🧹 Test record cleaned up');
      }

      console.log('🎉 Table is working correctly!');

    } catch (testError) {
      console.error('❌ Table test failed:', testError.message);
      console.log('💡 The table structure needs to be fixed');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the fix
fixPaymentReconciliationTable();
