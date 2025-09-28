#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔍 Diagnosing lats_sales Authentication Issue');
console.log('============================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseSalesAuth() {
  try {
    console.log('\n📊 1. Checking lats_sales table structure...');
    const { data: salesStructure, error: structureError } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Structure check failed:', structureError.message);
    } else {
      console.log('✅ Table structure accessible');
      if (salesStructure.length > 0) {
        console.log('📋 Sample sales record structure:');
        Object.keys(salesStructure[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof salesStructure[0][key]}`);
        });
      }
    }

    console.log('\n📊 2. Testing INSERT operation...');
    const testSaleData = {
      sale_number: 'TEST-' + Date.now(),
      customer_id: null,
      total_amount: 1000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null,
      subtotal: 1000,
      discount_amount: 0,
      discount_type: 'none',
      discount_value: 0,
      customer_name: 'Test Customer',
      customer_phone: '+255123456789',
      tax: 0
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('lats_sales')
      .insert(testSaleData)
      .select();

    if (insertError) {
      console.error('❌ INSERT test failed:', insertError.message);
      console.error('🔍 Error details:', insertError);
    } else {
      console.log('✅ INSERT test successful:', insertResult);
    }

    console.log('\n📊 3. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'lats_sales' })
      .catch(async () => {
        // Fallback: try to get policies using information_schema
        const { data: fallbackPolicies, error: fallbackError } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'lats_sales');
        
        if (fallbackError) {
          console.log('⚠️  Could not retrieve RLS policies directly');
          return { data: null, error: fallbackError };
        }
        return { data: fallbackPolicies, error: null };
      });

    if (policiesError) {
      console.log('⚠️  Could not retrieve RLS policies:', policiesError.message);
    } else if (policies) {
      console.log('📋 RLS Policies found:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.qual})`);
      });
    }

    console.log('\n📊 4. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  Auth check failed:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.id);
    } else {
      console.log('❌ No authenticated user - this might be the issue!');
    }

    console.log('\n📊 5. Testing with service role key...');
    const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: serviceInsert, error: serviceError } = await serviceSupabase
      .from('lats_sales')
      .insert({
        sale_number: 'SERVICE-TEST-' + Date.now(),
        total_amount: 2000,
        status: 'completed',
        customer_name: 'Service Test'
      })
      .select();

    if (serviceError) {
      console.error('❌ Service role test failed:', serviceError.message);
    } else {
      console.log('✅ Service role test successful:', serviceInsert);
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

// Run the diagnosis
diagnoseSalesAuth();
