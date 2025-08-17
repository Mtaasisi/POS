// Script to diagnose and fix real-time subscription issues
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 30000),
  },
});

async function testBasicConnection() {
  console.log('🔍 Testing basic database connection...');
  
  try {
    const { data, error } = await supabase
      .from('lats_stock_movements')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed with exception:', error);
    return false;
  }
}

async function testAuthentication() {
  console.log('🔍 Testing authentication...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Authentication failed:', error);
      return false;
    }

    console.log('✅ Authentication successful');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed with exception:', error);
    return false;
  }
}

async function testRealtimeSubscription() {
  console.log('🔍 Testing real-time subscription...');
  
  return new Promise((resolve) => {
    const testChannelId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let subscriptionSuccess = false;
    let subscriptionError = '';
    let subscriptionCompleted = false;

    console.log('📡 Creating test subscription with channel ID:', testChannelId);

    const testChannel = supabase.channel(testChannelId)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'lats_stock_movements' 
        },
        () => {} // Empty handler for test
      )
      .subscribe((status) => {
        console.log('📡 Test subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          subscriptionSuccess = true;
          subscriptionCompleted = true;
          console.log('✅ Test subscription successful');
          testChannel.unsubscribe();
          resolve({ success: true });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          subscriptionError = `Subscription failed with status: ${status}`;
          subscriptionCompleted = true;
          console.error('❌ Test subscription failed:', status);
          testChannel.unsubscribe();
          resolve({ success: false, error: subscriptionError });
        } else if (status === 'TIMED_OUT') {
          subscriptionError = 'Subscription test timed out';
          subscriptionCompleted = true;
          console.error('⏰ Test subscription timed out');
          testChannel.unsubscribe();
          resolve({ success: false, error: subscriptionError });
        }
      });

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!subscriptionCompleted) {
        console.error('⏰ Test subscription timed out after 10 seconds');
        testChannel.unsubscribe();
        resolve({ success: false, error: 'Subscription test timed out' });
      }
    }, 10000);
  });
}

async function checkTablePermissions() {
  console.log('🔍 Checking table permissions...');
  
  const tables = ['lats_stock_movements', 'lats_product_variants', 'lats_products'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.error(`❌ Permission check failed for ${table}:`, error);
      } else {
        console.log(`✅ Permission check passed for ${table}`);
      }
    } catch (error) {
      console.error(`❌ Permission check failed for ${table} with exception:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting real-time subscription diagnostics...\n');

  // Test basic connection
  const dbConnected = await testBasicConnection();
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed - database connection failed');
    return;
  }

  // Test authentication
  const authSuccess = await testAuthentication();
  if (!authSuccess) {
    console.log('\n⚠️ Authentication failed, but continuing with anonymous access');
  }

  // Check table permissions
  await checkTablePermissions();

  // Test real-time subscription
  const subscriptionResult = await testRealtimeSubscription();
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('=====================');
  console.log(`Database Connection: ${dbConnected ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Authentication: ${authSuccess ? '✅ PASS' : '⚠️ FAIL (anonymous access)'}`);
  console.log(`Real-time Subscription: ${subscriptionResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!subscriptionResult.success) {
    console.log(`\n🔧 RECOMMENDED FIXES:`);
    console.log('==================');
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase service status');
    console.log('3. Check if your Supabase project has real-time enabled');
    console.log('4. Verify your API keys are correct');
    console.log('5. Check if you have the necessary permissions for real-time subscriptions');
    console.log('6. Try refreshing your browser and clearing cache');
    console.log('7. Check browser console for any CORS or network errors');
    
    if (subscriptionResult.error) {
      console.log(`\n📝 ERROR DETAILS: ${subscriptionResult.error}`);
    }
  } else {
    console.log('\n✅ All tests passed! Your real-time subscription should work correctly.');
  }
}

// Run the diagnostics
main().catch(console.error);
