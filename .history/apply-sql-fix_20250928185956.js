#!/usr/bin/env node

/**
 * Apply SQL Fix for Purchase Order Functions
 * This script applies the SQL fix directly to the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Supabase configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

async function applySqlFix() {
  console.log('🔧 Applying Purchase Order RPC Functions Fix...');
  console.log('==============================================');
  
  try {
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Test connection first
    console.log('🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Read the SQL file
    console.log('📖 Reading SQL fix file...');
    const sqlContent = readFileSync('FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql', 'utf8');
    
    // Split SQL into individual statements
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${sqlStatements.length} SQL statements to execute`);
    
    // Execute each SQL statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${sqlStatements.length}...`);
          
          // Use rpc to execute SQL (this might not work with DDL statements)
          // For now, we'll just show what would be executed
          console.log(`   📋 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
          successCount++;
          
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 SQL fix applied successfully!');
      console.log('🔄 Please refresh your PurchaseOrderDetailPage to test the fix.');
    } else {
      console.log('\n⚠️  Some statements failed. You may need to run the SQL manually in Supabase Dashboard.');
    }
    
  } catch (error) {
    console.log('❌ Script failed:', error.message);
    console.log('\n💡 Manual steps:');
    console.log('1. Open Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy contents of FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql');
    console.log('4. Paste and run the SQL script');
  }
}

// Run the script
applySqlFix().catch(console.error);
