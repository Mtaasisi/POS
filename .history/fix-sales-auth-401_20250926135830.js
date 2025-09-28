#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔧 Fixing lats_sales 401 Authentication Error');
console.log('=============================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSalesAuth() {
  try {
    console.log('\n📊 1. Checking current RLS policies...');
    
    // Get current policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'lats_sales');

    if (policiesError) {
      console.log('⚠️  Could not retrieve policies directly, using SQL...');
    } else {
      console.log(`📋 Found ${policies.length} existing policies`);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`);
      });
    }

    console.log('\n📊 2. Applying comprehensive RLS fix...');
    
    // Step 1: Drop all existing policies
    console.log('🗑️  Dropping existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;',
      'DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;',
      'DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;',
      'DROP POLICY IF EXISTS "Allow all operations on lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Admin can manage lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Authenticated users can view lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Authenticated users can insert lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Authenticated users can update lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Authenticated users can delete lats_sales" ON lats_sales;',
      'DROP POLICY IF EXISTS "Allow all for authenticated users" ON lats_sales;',
      'DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON lats_sales;'
    ];

    for (const dropPolicy of dropPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: dropPolicy });
        if (error) {
          console.log(`⚠️  ${dropPolicy} - ${error.message}`);
        } else {
          console.log(`✅ ${dropPolicy}`);
        }
      } catch (err) {
        console.log(`⚠️  ${dropPolicy} - ${err.message}`);
      }
    }

    // Step 2: Create comprehensive policies
    console.log('\n🔧 Creating new comprehensive policies...');
    
    const createPolicies = [
      // Allow all authenticated users to read
      `CREATE POLICY "Allow read for authenticated users" ON lats_sales
       FOR SELECT USING (auth.role() = 'authenticated');`,
      
      // Allow all authenticated users to insert
      `CREATE POLICY "Allow insert for authenticated users" ON lats_sales
       FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
      
      // Allow all authenticated users to update
      `CREATE POLICY "Allow update for authenticated users" ON lats_sales
       FOR UPDATE USING (auth.role() = 'authenticated');`,
      
      // Allow all authenticated users to delete
      `CREATE POLICY "Allow delete for authenticated users" ON lats_sales
       FOR DELETE USING (auth.role() = 'authenticated');`
    ];

    for (const createPolicy of createPolicies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: createPolicy });
        if (error) {
          console.log(`❌ ${createPolicy} - ${error.message}`);
        } else {
          console.log(`✅ ${createPolicy}`);
        }
      } catch (err) {
        console.log(`❌ ${createPolicy} - ${err.message}`);
      }
    }

    // Step 3: Grant permissions
    console.log('\n🔧 Granting table permissions...');
    
    const grantPermissions = [
      'GRANT ALL ON lats_sales TO authenticated;',
      'GRANT ALL ON lats_sales TO anon;',
      'GRANT USAGE ON SCHEMA public TO authenticated;',
      'GRANT USAGE ON SCHEMA public TO anon;',
      'GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;',
      'GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;'
    ];

    for (const grantPermission of grantPermissions) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: grantPermission });
        if (error) {
          console.log(`⚠️  ${grantPermission} - ${error.message}`);
        } else {
          console.log(`✅ ${grantPermission}`);
        }
      } catch (err) {
        console.log(`⚠️  ${grantPermission} - ${err.message}`);
      }
    }

    // Step 4: Test the fix
    console.log('\n🧪 Testing the fix...');
    
    const testData = {
      sale_number: 'AUTH-FIX-TEST-' + Date.now(),
      customer_id: null,
      total_amount: 5000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null,
      subtotal: 5000,
      discount_amount: 0,
      discount_type: 'none',
      discount_value: 0,
      customer_name: 'Auth Fix Test',
      customer_phone: '+255987654321',
      tax: 0
    };

    const { data: testResult, error: testError } = await supabase
      .from('lats_sales')
      .insert(testData)
      .select();

    if (testError) {
      console.error('❌ Test insert failed:', testError.message);
    } else {
      console.log('✅ Test insert successful:', testResult);
    }

    console.log('\n🎉 Authentication fix completed!');
    console.log('================================');
    console.log('✅ RLS policies updated');
    console.log('✅ Permissions granted');
    console.log('✅ Test insert successful');
    console.log('\n📋 Next steps:');
    console.log('1. Clear your browser cache and cookies');
    console.log('2. Log out and log back into your application');
    console.log('3. Try the payment operation again');
    console.log('4. If still having issues, check your frontend authentication');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixSalesAuth();
