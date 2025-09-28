#!/usr/bin/env node

// Supabase Database Fix - Direct Client Approach
// This script fixes your database issues using direct Supabase client operations

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0';

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('lats_sales').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Connection test result:', error.message);
      return false;
    } else {
      console.log('✅ Connection successful');
      return true;
    }
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
    return false;
  }
}

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    
    if (error && error.code === 'PGRST116') {
      return false; // Table doesn't exist
    }
    
    return true; // Table exists
  } catch (err) {
    return false;
  }
}

async function createMissingTables() {
  console.log('🔧 Creating missing tables...');
  
  // Check if lats_sale_items exists
  const saleItemsExists = await checkTableExists('lats_sale_items');
  if (!saleItemsExists) {
    console.log('📝 Creating lats_sale_items table...');
    // Note: We can't create tables via the client, this needs to be done via SQL editor
    console.log('⚠️  lats_sale_items table needs to be created via Supabase SQL editor');
  } else {
    console.log('✅ lats_sale_items table exists');
  }
  
  // Check if lats_products exists
  const productsExists = await checkTableExists('lats_products');
  if (!productsExists) {
    console.log('📝 Creating lats_products table...');
    console.log('⚠️  lats_products table needs to be created via Supabase SQL editor');
  } else {
    console.log('✅ lats_products table exists');
  }
  
  // Check if lats_product_variants exists
  const variantsExists = await checkTableExists('lats_product_variants');
  if (!variantsExists) {
    console.log('📝 Creating lats_product_variants table...');
    console.log('⚠️  lats_product_variants table needs to be created via Supabase SQL editor');
  } else {
    console.log('✅ lats_product_variants table exists');
  }
}

async function testSalesQuery() {
  console.log('🔍 Testing sales query...');
  
  try {
    // Test the complex query that was failing
    const { data, error } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items (
          *,
          lats_products (
            *,
            lats_product_variants (*)
          )
        )
      `)
      .limit(1);
    
    if (error) {
      console.log('❌ Sales query failed:', error.message);
      console.log('🔍 Error details:', error);
    } else {
      console.log('✅ Sales query successful');
      console.log('📊 Found', data?.length || 0, 'sales records');
    }
  } catch (err) {
    console.log('❌ Sales query exception:', err.message);
  }
}

async function testReceiptInsertion() {
  console.log('🔍 Testing receipt insertion...');
  
  try {
    // First, get a sale ID to test with
    const { data: sales, error: salesError } = await supabase
      .from('lats_sales')
      .select('id')
      .limit(1);
    
    if (salesError || !sales || sales.length === 0) {
      console.log('⚠️  No sales found to test receipt insertion');
      return;
    }
    
    const saleId = sales[0].id;
    console.log('📝 Testing with sale ID:', saleId);
    
    // Test receipt insertion
    const { data, error } = await supabase
      .from('lats_receipts')
      .insert({
        sale_id: saleId,
        receipt_number: `TEST-RECEIPT-${Date.now()}`,
        customer_name: 'Test Customer',
        customer_phone: '+255700000000',
        total_amount: 100.00,
        payment_method: '{"type": "cash", "amount": 100.00}',
        items_count: 1,
        generated_by: 'System Test',
        receipt_content: 'Test receipt content'
      })
      .select();
    
    if (error) {
      console.log('❌ Receipt insertion failed:', error.message);
      console.log('🔍 Error details:', error);
    } else {
      console.log('✅ Receipt insertion successful');
      console.log('📊 Created receipt ID:', data[0]?.id);
      
      // Clean up test receipt
      await supabase
        .from('lats_receipts')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Test receipt cleaned up');
    }
  } catch (err) {
    console.log('❌ Receipt insertion exception:', err.message);
  }
}

async function main() {
  console.log('🚀 Starting Supabase Database Fix...\n');
  
  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  console.log('\n📋 Database Status Check:');
  await createMissingTables();
  
  console.log('\n🔍 Testing Queries:');
  await testSalesQuery();
  await testReceiptInsertion();
  
  console.log('\n📝 Next Steps:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run the essential-database-fix.sql script');
  console.log('4. Or copy and paste the SQL commands manually');
  
  console.log('\n🎉 Database fix analysis completed!');
}

// Run the fix
main().catch(console.error);
