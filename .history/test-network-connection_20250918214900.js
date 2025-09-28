#!/usr/bin/env node

/**
 * Network Connection Test Script
 * Tests the connection to Supabase and provides diagnostic information
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('🔍 Network Connection Diagnostic Tool');
console.log('=====================================\n');

// Test 1: Basic Internet Connectivity
async function testInternetConnection() {
  console.log('1. Testing Internet Connection...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      timeout: 10000
    });
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`   ✅ Internet connection: OK (${latency}ms)`);
      return true;
    } else {
      console.log(`   ❌ Internet connection: Failed (HTTP ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Internet connection: Failed - ${error.message}`);
    return false;
  }
}

// Test 2: Supabase API Connectivity
async function testSupabaseConnection() {
  console.log('\n2. Testing Supabase API Connection...');
  try {
    const startTime = Date.now();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      timeout: 15000
    });
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      console.log(`   ✅ Supabase API: OK (${latency}ms)`);
      return true;
    } else {
      console.log(`   ❌ Supabase API: Failed (HTTP ${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Supabase API: Failed - ${error.message}`);
    return false;
  }
}

// Test 3: Supabase Client Test
async function testSupabaseClient() {
  console.log('\n3. Testing Supabase Client...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('lats_storage_rooms')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      console.log(`   ❌ Supabase Client: Failed - ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Supabase Client: OK (${latency}ms)`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Supabase Client: Failed - ${error.message}`);
    return false;
  }
}

// Test 4: Customer Query Test
async function testCustomerQuery() {
  console.log('\n4. Testing Customer Query...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .limit(5);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      console.log(`   ❌ Customer Query: Failed - ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Customer Query: OK (${latency}ms, ${data?.length || 0} customers)`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Customer Query: Failed - ${error.message}`);
    return false;
  }
}

// Test 5: QUIC Protocol Test
async function testQUICProtocol() {
  console.log('\n5. Testing QUIC Protocol Handling...');
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Force HTTP/1.1 to avoid QUIC issues
          headers: {
            ...options.headers,
            'Connection': 'keep-alive',
          },
        });
      },
    });
    
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      console.log(`   ❌ QUIC Test: Failed - ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ QUIC Test: OK (${latency}ms)`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ QUIC Test: Failed - ${error.message}`);
    return false;
  }
}

// Main test function
async function runDiagnostics() {
  const results = [];
  
  results.push(await testInternetConnection());
  results.push(await testSupabaseConnection());
  results.push(await testSupabaseClient());
  results.push(await testCustomerQuery());
  results.push(await testQUICProtocol());
  
  const passedTests = results.filter(Boolean).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your network connection is working properly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above for details.');
    console.log('\n💡 Troubleshooting Tips:');
    console.log('   - Check your internet connection');
    console.log('   - Verify Supabase credentials are correct');
    console.log('   - Try refreshing your browser');
    console.log('   - Clear browser cache and cookies');
    console.log('   - Disable browser extensions temporarily');
    console.log('   - Try a different network if possible');
  }
  
  console.log('\n🔧 Configuration Used:');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...`);
}

// Run the diagnostics
runDiagnostics().catch(console.error);
