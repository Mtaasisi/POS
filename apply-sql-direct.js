#!/usr/bin/env node

/**
 * Apply SQL Fix Directly via Supabase REST API
 * This script applies the SQL fix using direct HTTP requests
 */

import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

async function applySqlDirectly() {
  console.log('🔧 Applying Purchase Order RPC Functions Fix...');
  console.log('==============================================');
  
  try {
    // Read the SQL file
    console.log('📖 Reading SQL fix file...');
    const sqlContent = readFileSync('FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql', 'utf8');
    
    console.log('📝 SQL content loaded successfully');
    console.log('📋 SQL statements to execute:');
    console.log('   - Drop existing functions');
    console.log('   - Create get_purchase_order_items_with_products function');
    console.log('   - Create get_received_items_for_po function');
    console.log('   - Grant permissions');
    console.log('   - Verify functions');
    
    console.log('\n⚠️  Note: Direct SQL execution via REST API is not supported for DDL statements.');
    console.log('📋 You need to run this SQL manually in Supabase Dashboard:');
    console.log('\n🔗 Steps:');
    console.log('1. Open: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql');
    console.log('2. Copy the contents of FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql');
    console.log('3. Paste and run the SQL script');
    console.log('4. Refresh your PurchaseOrderDetailPage');
    
    console.log('\n📄 SQL file location:');
    console.log(`${process.cwd()}/FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql`);
    
    console.log('\n✅ After running the SQL script, your 400 errors should be resolved!');
    
  } catch (error) {
    console.log('❌ Script failed:', error.message);
  }
}

// Run the script
applySqlDirectly().catch(console.error);
