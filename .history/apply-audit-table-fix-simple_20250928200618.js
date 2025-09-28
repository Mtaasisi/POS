const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuditTableConnection() {
  try {
    console.log('🔍 Testing audit table connection...');
    
    // Test if we can query the audit table
    const { data, error } = await supabase
      .from('purchase_order_audit')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Audit table query failed:', error.message);
      return false;
    }
    
    console.log('✅ Audit table is accessible');
    return true;
    
  } catch (error) {
    console.error('❌ Error testing audit table:', error);
    return false;
  }
}

async function testAuditTableInsert() {
  try {
    console.log('🔍 Testing audit table insert...');
    
    // Get a test purchase order ID
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id')
      .limit(1);
    
    if (ordersError || !orders || orders.length === 0) {
      console.log('⚠️ No purchase orders found for testing');
      return false;
    }
    
    const testOrderId = orders[0].id;
    
    // Test insert
    const { data, error } = await supabase
      .from('purchase_order_audit')
      .insert({
        purchase_order_id: testOrderId,
        action: 'test_action',
        details: { test: true },
        user_id: null,
        created_by: null,
        timestamp: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.log('❌ Audit table insert failed:', error.message);
      return false;
    }
    
    console.log('✅ Audit table insert successful');
    
    // Clean up test record
    await supabase
      .from('purchase_order_audit')
      .delete()
      .eq('action', 'test_action');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing audit table insert:', error);
    return false;
  }
}

async function checkAuditTableStructure() {
  try {
    console.log('🔍 Checking audit table structure...');
    
    // Try to get table info by querying with specific columns
    const { data, error } = await supabase
      .from('purchase_order_audit')
      .select('id, purchase_order_id, action, details, user_id, created_by, timestamp')
      .limit(1);
    
    if (error) {
      console.log('❌ Audit table structure check failed:', error.message);
      return false;
    }
    
    console.log('✅ Audit table structure is correct');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking audit table structure:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting audit table diagnostics...');
  
  const results = {
    connection: false,
    structure: false,
    insert: false
  };
  
  // Test 1: Connection
  results.connection = await testAuditTableConnection();
  
  if (results.connection) {
    // Test 2: Structure
    results.structure = await checkAuditTableStructure();
    
    // Test 3: Insert
    results.insert = await testAuditTableInsert();
  }
  
  console.log('\n📊 Audit Table Diagnostics Results:');
  console.log('Connection:', results.connection ? '✅' : '❌');
  console.log('Structure:', results.structure ? '✅' : '❌');
  console.log('Insert:', results.insert ? '✅' : '❌');
  
  if (results.connection && results.structure && results.insert) {
    console.log('\n🎉 Audit table is working correctly!');
    return true;
  } else {
    console.log('\n💥 Audit table has issues that need to be fixed.');
    console.log('\n🔧 To fix the audit table, please run the following SQL in your Supabase SQL editor:');
    console.log('\n' + '='.repeat(60));
    console.log('-- Copy and paste this SQL into your Supabase SQL editor:');
    console.log('-- https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql');
    console.log('\n' + '='.repeat(60));
    
    const fs = require('fs');
    const sqlContent = fs.readFileSync('FIX_AUDIT_TABLE_COMPREHENSIVE.sql', 'utf8');
    console.log(sqlContent);
    console.log('\n' + '='.repeat(60));
    
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
});