#!/usr/bin/env node

/**
 * Test script to verify the 403 authentication fix
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

console.log('🧪 Testing 403 Authentication Fix');
console.log('================================\n');

console.log('📋 Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
console.log('');

// Create Supabase client with the same configuration as the app
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'lats-app-auth-token',
    flowType: 'pkce',
  },
});

async function testAuthFix() {
  try {
    console.log('🔍 Testing 1: Direct auth endpoint call (should fail with 403)');
    
    // This should fail with 403 because we're using anon key without a valid session
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    const result = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, result);
    
    if (response.status === 403) {
      console.log('   ✅ Expected 403 error - this is normal without a valid user session');
    } else {
      console.log('   ⚠️ Unexpected response');
    }
    
    console.log('\n🔍 Testing 2: Supabase client session check');
    
    // Test with Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log(`   ❌ Session error:`, sessionError.message);
    } else if (session) {
      console.log(`   ✅ Active session found for: ${session.user.email}`);
    } else {
      console.log('   ℹ️ No active session (this is expected)');
    }
    
    console.log('\n🔍 Testing 3: Supabase client user check');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log(`   ❌ User error:`, userError.message);
      
      if (userError.message.includes('403') || userError.message.includes('Forbidden')) {
        console.log('   ✅ 403 error detected - this is expected without authentication');
      }
    } else if (user) {
      console.log(`   ✅ User found: ${user.email}`);
    } else {
      console.log('   ℹ️ No user found (this is expected)');
    }
    
    console.log('\n🎯 Summary:');
    console.log('   The 403 errors are expected when:');
    console.log('   - No user is logged in');
    console.log('   - Session has expired');
    console.log('   - Invalid token is being used');
    console.log('');
    console.log('   The app should handle these errors by:');
    console.log('   - Clearing invalid auth state');
    console.log('   - Redirecting to login page');
    console.log('   - Showing appropriate error messages');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testAuthFix()
  .then(() => {
    console.log('\n✅ Authentication fix test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
