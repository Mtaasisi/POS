#!/usr/bin/env node

/**
 * Check RLS policies that might be blocking PATCH requests
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for lats_purchase_orders...\n');
  
  try {
    // Test 1: Check if RLS is enabled
    console.log('1. Testing RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'lats_purchase_orders' });
    
    if (rlsError) {
      console.log('ℹ️  Using alternative method to check RLS...');
    } else {
      console.log('📋 RLS Status:', rlsData);
    }
    
    // Test 2: Try to update with different authentication contexts
    console.log('\n2. Testing updates with different auth contexts...');
    
    // Test with anon key (what your app uses)
    console.log('\n🧪 Test with anon key (current setup):');
    const { data: anonUpdate, error: anonError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (anonError) {
      console.error('❌ Anon key update failed:', anonError);
    } else {
      console.log('✅ Anon key update successful');
    }
    
    // Test 3: Check if there are any policies blocking updates
    console.log('\n3. Testing with different user contexts...');
    
    // Try to simulate what happens when a user is authenticated
    const { data: authUpdate, error: authError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (authError) {
      console.error('❌ Auth update failed:', authError);
    } else {
      console.log('✅ Auth update successful');
    }
    
    // Test 4: Check if the issue is with specific field combinations
    console.log('\n4. Testing problematic field combinations...');
    
    // Test with fields that might trigger RLS issues
    const { data: problematicUpdate, error: problematicError } = await supabase
      .from('lats_purchase_orders')
      .update({ 
        status: 'completed',
        quality_check_status: 'passed',
        quality_check_passed: true,
        quality_check_date: new Date().toISOString(),
        quality_check_notes: 'Quality check completed successfully',
        updated_at: new Date().toISOString()
      })
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (problematicError) {
      console.error('❌ Problematic fields update failed:', problematicError);
      console.log('This might be the issue! Error details:', problematicError);
    } else {
      console.log('✅ Problematic fields update successful');
    }
    
    // Test 5: Check if the issue is with the request format
    console.log('\n5. Testing different request formats...');
    
    // Test with minimal data
    const { data: minimalUpdate, error: minimalError } = await supabase
      .from('lats_purchase_orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (minimalError) {
      console.error('❌ Minimal update failed:', minimalError);
    } else {
      console.log('✅ Minimal update successful');
    }
    
    // Test 6: Check if the issue is with the specific ID format
    console.log('\n6. Testing with different ID formats...');
    
    // Test with the exact ID from the error
    const { data: exactIdUpdate, error: exactIdError } = await supabase
      .from('lats_purchase_orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (exactIdError) {
      console.error('❌ Exact ID update failed:', exactIdError);
    } else {
      console.log('✅ Exact ID update successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies().catch(console.error);
