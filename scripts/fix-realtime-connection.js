#!/usr/bin/env node

/**
 * Real-Time Connection Diagnostic and Fix Script
 * 
 * This script helps diagnose and fix real-time connection issues in the LATS application.
 * Run this script when you're experiencing "CLOSED" subscription status.
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - update these with your actual values
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 30000),
  },
});

console.log('🔧 Real-Time Connection Diagnostic Tool');
console.log('=====================================\n');

async function testDatabaseConnection() {
  console.log('1. Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('lats_stock_movements')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function testRealtimeSubscription() {
  console.log('\n2. Testing real-time subscription...');
  
  return new Promise((resolve) => {
    const channelId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const channel = supabase.channel(channelId);
    
    let subscriptionResult = null;
    let timeoutId = null;
    
    const testSubscription = channel
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'lats_stock_movements' 
        },
        () => {} // Empty handler
      )
      .subscribe((status) => {
        console.log(`   📡 Subscription status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          subscriptionResult = { success: true, status };
          cleanup();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscriptionResult = { success: false, status };
          cleanup();
        }
      });
    
    timeoutId = setTimeout(() => {
      subscriptionResult = { success: false, status: 'TIMEOUT' };
      cleanup();
    }, 10000); // 10 second timeout
    
    function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      try {
        channel.unsubscribe();
      } catch (error) {
        console.log('   ⚠️ Cleanup warning:', error.message);
      }
      
      resolve(subscriptionResult);
    }
  });
}

async function checkNetworkConnectivity() {
  console.log('\n3. Checking network connectivity...');
  
  try {
    // Test basic internet connectivity
    const response = await fetch('https://httpbin.org/get', { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log('✅ Internet connectivity: OK');
      return true;
    } else {
      console.log('⚠️ Internet connectivity: Limited');
      return false;
    }
  } catch (error) {
    console.log('❌ Internet connectivity: Failed');
    return false;
  }
}

async function checkSupabaseRealtimeStatus() {
  console.log('\n4. Checking Supabase real-time service status...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log('✅ Supabase service: Available');
      return true;
    } else {
      console.log('⚠️ Supabase service: Limited access');
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase service: Unavailable');
    return false;
  }
}

async function runDiagnostics() {
  console.log('Starting diagnostics...\n');
  
  const results = {
    database: await testDatabaseConnection(),
    network: await checkNetworkConnectivity(),
    supabase: await checkSupabaseRealtimeStatus(),
    realtime: await testRealtimeSubscription()
  };
  
  console.log('\n📊 Diagnostic Results:');
  console.log('=====================');
  console.log(`Database Connection: ${results.database ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Network Connectivity: ${results.network ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Supabase Service: ${results.supabase ? '✅ OK' : '❌ FAILED'}`);
  console.log(`Real-time Subscription: ${results.realtime?.success ? '✅ OK' : '❌ FAILED'}`);
  
  if (results.realtime && !results.realtime.success) {
    console.log(`   Real-time Status: ${results.realtime.status}`);
  }
  
  console.log('\n🔧 Recommendations:');
  console.log('==================');
  
  if (!results.database) {
    console.log('• Check your Supabase URL and API key configuration');
    console.log('• Verify your database is accessible');
  }
  
  if (!results.network) {
    console.log('• Check your internet connection');
    console.log('• Verify firewall settings');
  }
  
  if (!results.supabase) {
    console.log('• Supabase service might be experiencing issues');
    console.log('• Check Supabase status page');
  }
  
  if (!results.realtime?.success) {
    console.log('• Real-time service is not working properly');
    console.log('• Try the following fixes:');
    console.log('  1. Refresh the application');
    console.log('  2. Clear browser cache and cookies');
    console.log('  3. Check browser console for errors');
    console.log('  4. Try using the "Force Reconnect" button in the debug panel');
    console.log('  5. Restart the application');
  }
  
  if (results.database && results.network && results.supabase && results.realtime?.success) {
    console.log('• All systems are working correctly');
    console.log('• The issue might be in the application code');
    console.log('• Try refreshing the page or restarting the application');
  }
  
  console.log('\n✨ Diagnostic complete!');
}

// Run diagnostics
runDiagnostics().catch(console.error);
