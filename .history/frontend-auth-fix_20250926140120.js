#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

console.log('🔧 Frontend Authentication Fix for lats_sales');
console.log('============================================');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Create client with enhanced configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'lats-app-auth-token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'lats-app',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  },
});

async function testFrontendAuth() {
  try {
    console.log('\n📊 1. Testing authentication status...');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User authenticated:', session.user.id);
      console.log('📧 User email:', session.user.email);
    } else {
      console.log('❌ No active session - this is likely the issue!');
    }

    console.log('\n📊 2. Testing sales insert with current auth...');
    
    const testSaleData = {
      sale_number: 'FRONTEND-TEST-' + Date.now(),
      customer_id: null,
      total_amount: 3000,
      payment_method: 'cash',
      status: 'completed',
      created_by: null,
      subtotal: 3000,
      discount_amount: 0,
      discount_type: 'none',
      discount_value: 0,
      customer_name: 'Frontend Test',
      customer_phone: '+255111222333',
      tax: 0
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('lats_sales')
      .insert(testSaleData)
      .select();

    if (insertError) {
      console.error('❌ Frontend insert failed:', insertError.message);
      console.error('🔍 Error details:', insertError);
      
      // Check if it's an auth error
      if (insertError.message.includes('401') || insertError.message.includes('Unauthorized')) {
        console.log('\n🔧 AUTHENTICATION ISSUE DETECTED!');
        console.log('==================================');
        console.log('The 401 error indicates your frontend is not properly authenticated.');
        console.log('\n📋 Solutions:');
        console.log('1. Check if user is logged in before making sales');
        console.log('2. Ensure Supabase client is properly configured');
        console.log('3. Clear browser cache and cookies');
        console.log('4. Log out and log back in');
        console.log('5. Check your frontend authentication flow');
      }
    } else {
      console.log('✅ Frontend insert successful:', insertResult);
    }

    console.log('\n📊 3. Testing with service role (bypass auth)...');
    
    const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: serviceResult, error: serviceError } = await serviceSupabase
      .from('lats_sales')
      .insert({
        sale_number: 'SERVICE-BYPASS-' + Date.now(),
        total_amount: 4000,
        status: 'completed',
        customer_name: 'Service Bypass Test'
      })
      .select();

    if (serviceError) {
      console.error('❌ Service role test failed:', serviceError.message);
    } else {
      console.log('✅ Service role test successful:', serviceResult);
      console.log('\n💡 SOLUTION: Use service role key for backend operations!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFrontendAuth();
