#!/usr/bin/env node

// Check RLS Policies for WhatsApp Table
// This script checks Row Level Security settings

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with ANON key (like the app)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking RLS policies for WhatsApp messages table...\n');

async function checkWithServiceKey() {
  console.log('📋 Step 1: Testing with SERVICE ROLE key (admin access)...');
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await supabaseAdmin
      .from('whatsapp_messages')
      .select('chat_id,content,message,timestamp,direction,sender_name')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.log('❌ SERVICE ROLE query failed:', error.message);
    } else {
      console.log(`✅ SERVICE ROLE query successful! Found ${data?.length || 0} records`);
    }
  } catch (e) {
    console.log('❌ SERVICE ROLE error:', e.message);
  }
}

async function checkWithAnonKey() {
  console.log('\n📋 Step 2: Testing with ANON key (like your app)...');
  
  if (!supabaseAnonKey) {
    console.log('❌ No VITE_SUPABASE_ANON_KEY found in environment');
    return;
  }
  
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data, error } = await supabaseAnon
      .from('whatsapp_messages')
      .select('chat_id,content,message,timestamp,direction,sender_name')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.log('❌ ANON key query failed:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error details:', JSON.stringify(error.details, null, 2));
      
      if (error.message?.includes('row-level security') || 
          error.message?.includes('RLS') ||
          error.code === 'PGRST301') {
        console.log('\n🚨 ROOT CAUSE FOUND: Row Level Security is blocking access!');
        console.log('   The table has RLS enabled but no policies allow anonymous access.');
      }
    } else {
      console.log(`✅ ANON key query successful! Found ${data?.length || 0} records`);
    }
  } catch (e) {
    console.log('❌ ANON key error:', e.message);
  }
}

async function checkAuthenticatedAccess() {
  console.log('\n📋 Step 3: Testing with authenticated user simulation...');
  
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  
  // Try to simulate what happens when user is "authenticated"
  try {
    // First, let's see if there are any auth users
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️  No authenticated user found');
    } else {
      console.log('✅ Found authenticated user:', user.email);
    }
    
    // Try the query with current auth state
    const { data, error } = await supabaseAuth
      .from('whatsapp_messages')
      .select('chat_id,content,message,timestamp,direction,sender_name')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.log('❌ Authenticated query failed:', error.message);
    } else {
      console.log(`✅ Authenticated query successful! Found ${data?.length || 0} records`);
    }
  } catch (e) {
    console.log('❌ Authentication test error:', e.message);
  }
}

async function checkRLSStatus() {
  console.log('\n📋 Step 4: Checking RLS status and policies...');
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if RLS is enabled (this requires admin privileges)
    const { data, error } = await supabaseAdmin
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'whatsapp_messages');

    if (error) {
      console.log('⚠️  Could not check RLS status:', error.message);
    } else if (data && data.length > 0) {
      const rlsEnabled = data[0].relrowsecurity;
      console.log(`📊 RLS enabled: ${rlsEnabled ? 'YES' : 'NO'}`);
      
      if (rlsEnabled) {
        console.log('\n🔧 SOLUTION: The table has RLS enabled. You need to either:');
        console.log('1. Disable RLS: ALTER TABLE whatsapp_messages DISABLE ROW LEVEL SECURITY;');
        console.log('2. Or add a policy for anonymous access');
        console.log('3. Or ensure users are properly authenticated before accessing the table');
      }
    }
  } catch (e) {
    console.log('⚠️  RLS check error:', e.message);
  }
}

// Run all checks
async function runAllChecks() {
  await checkWithServiceKey();
  await checkWithAnonKey();
  await checkAuthenticatedAccess();
  await checkRLSStatus();
  
  console.log('\n🎯 SUMMARY:');
  console.log('The 400 Bad Request error is likely caused by Row Level Security policies');
  console.log('blocking anonymous access to the whatsapp_messages table.');
  console.log('\n✅ To fix this, either:');
  console.log('1. Ensure users are authenticated before accessing WhatsApp features');
  console.log('2. Add RLS policies that allow the required access');
  console.log('3. Temporarily disable RLS for testing');
}

runAllChecks();
