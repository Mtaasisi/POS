#!/usr/bin/env node

/**
 * Database Connection Verification Script
 * This script tests all database connections and queries used in the device system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Table ${tableName}: ${error.message}`);
      return false;
    }
    
    console.log(`✅ Table ${tableName}: Exists and accessible`);
    return true;
  } catch (err) {
    console.log(`❌ Table ${tableName}: ${err.message}`);
    return false;
  }
}

async function testDeviceQueries() {
  console.log('\n🔍 Testing Device Queries...');
  
  try {
    // Test basic device query
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select(`
        id,
        customer_id,
        brand,
        model,
        serial_number,
        issue_description,
        status,
        assigned_to,
        expected_return_date,
        created_at,
        updated_at,
        estimated_hours,
        warranty_start,
        warranty_end,
        warranty_status,
        repair_count,
        last_return_date,
        diagnostic_checklist,
        repair_checklist,
        repair_price,
        repair_cost,
        deposit_amount
      `)
      .limit(1);
    
    if (devicesError) {
      console.log(`❌ Basic device query failed: ${devicesError.message}`);
      return false;
    }
    
    console.log('✅ Basic device query successful');
    
    // Test device with customer join
    const { data: devicesWithCustomers, error: customersError } = await supabase
      .from('devices')
      .select(`
        id,
        brand,
        model,
        customers (id, name, phone, email, color_tag, loyalty_level, total_spent, last_visit)
      `)
      .limit(1);
    
    if (customersError) {
      console.log(`❌ Device with customer join failed: ${customersError.message}`);
      return false;
    }
    
    console.log('✅ Device with customer join successful');
    
    // Test device with related tables
    const { data: devicesWithRelated, error: relatedError } = await supabase
      .from('devices')
      .select(`
        id,
        brand,
        model,
        remarks:device_remarks(*),
        transitions:device_transitions(*),
        ratings:device_ratings(*),
        payments:customer_payments(*)
      `)
      .limit(1);
    
    if (relatedError) {
      console.log(`❌ Device with related tables failed: ${relatedError.message}`);
      return false;
    }
    
    console.log('✅ Device with related tables successful');
    
    return true;
  } catch (err) {
    console.log(`❌ Device queries failed: ${err.message}`);
    return false;
  }
}

async function testCustomerQueries() {
  console.log('\n🔍 Testing Customer Queries...');
  
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        color_tag,
        loyalty_level,
        total_spent,
        last_visit,
        points,
        referred_by,
        referral_source
      `)
      .limit(1);
    
    if (error) {
      console.log(`❌ Customer query failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Customer query successful');
    return true;
  } catch (err) {
    console.log(`❌ Customer queries failed: ${err.message}`);
    return false;
  }
}

async function testPaymentQueries() {
  console.log('\n🔍 Testing Payment Queries...');
  
  try {
    // Test basic payment query
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select(`
        id,
        customer_id,
        device_id,
        amount,
        method,
        payment_type,
        status,
        payment_date,
        created_at
      `)
      .limit(1);
    
    if (paymentsError) {
      console.log(`❌ Payment query failed: ${paymentsError.message}`);
      return false;
    }
    
    console.log('✅ Payment query successful');
    
    // Test pending payments query
    const { data: pendingPayments, error: pendingError } = await supabase
      .from('customer_payments')
      .select('id, payment_type')
      .eq('status', 'pending')
      .limit(1);
    
    if (pendingError) {
      console.log(`❌ Pending payments query failed: ${pendingError.message}`);
      return false;
    }
    
    console.log('✅ Pending payments query successful');
    
    return true;
  } catch (err) {
    console.log(`❌ Payment queries failed: ${err.message}`);
    return false;
  }
}

async function testAuthUserQueries() {
  console.log('\n🔍 Testing Auth User Queries...');
  
  try {
    const { data: authUsers, error } = await supabase
      .from('auth_users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Auth users query failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Auth users query successful');
    return true;
  } catch (err) {
    console.log(`❌ Auth user queries failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Database Connection Verification...\n');
  
  // Test table existence
  console.log('📋 Testing Table Existence...');
  const tables = [
    'devices',
    'customers', 
    'customer_payments',
    'device_remarks',
    'device_transitions',
    'device_ratings',
    'auth_users'
  ];
  
  let allTablesExist = true;
  for (const table of tables) {
    const exists = await testTableExists(table);
    if (!exists) allTablesExist = false;
  }
  
  if (!allTablesExist) {
    console.log('\n❌ Some tables are missing. Please run the database migrations first.');
    process.exit(1);
  }
  
  // Test specific queries
  const deviceQueriesOk = await testDeviceQueries();
  const customerQueriesOk = await testCustomerQueries();
  const paymentQueriesOk = await testPaymentQueries();
  const authUserQueriesOk = await testAuthUserQueries();
  
  console.log('\n📊 Summary:');
  console.log(`Tables: ${allTablesExist ? '✅' : '❌'}`);
  console.log(`Device Queries: ${deviceQueriesOk ? '✅' : '❌'}`);
  console.log(`Customer Queries: ${customerQueriesOk ? '✅' : '❌'}`);
  console.log(`Payment Queries: ${paymentQueriesOk ? '✅' : '❌'}`);
  console.log(`Auth User Queries: ${authUserQueriesOk ? '✅' : '❌'}`);
  
  const allOk = allTablesExist && deviceQueriesOk && customerQueriesOk && paymentQueriesOk && authUserQueriesOk;
  
  if (allOk) {
    console.log('\n🎉 All database connections are working correctly!');
  } else {
    console.log('\n⚠️  Some database connections have issues. Please check the errors above.');
  }
  
  process.exit(allOk ? 0 : 1);
}

main().catch(console.error);
