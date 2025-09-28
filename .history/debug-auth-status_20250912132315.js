// Debug script to check authentication status
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthStatus() {
  console.log('🔍 Checking authentication status...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found:');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
      console.log('   Expires at:', new Date(session.expires_at * 1000).toISOString());
    } else {
      console.log('⚠️ No active session found');
    }

    // 2. Check current user
    console.log('\n2. Checking current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ User error:', userError.message);
    } else if (user) {
      console.log('✅ Current user found:');
      console.log('   User ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Last sign in:', user.last_sign_in_at);
    } else {
      console.log('⚠️ No current user found');
    }

    // 3. Test database access with current auth state
    console.log('\n3. Testing database access with current auth state...');
    const { data: testData, error: testError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(1);

    if (testError) {
      console.log('❌ Database access error:', testError.message);
      console.log('   Error code:', testError.code);
      console.log('   Error details:', testError.details);
    } else {
      console.log('✅ Database access successful');
      console.log('   Test data:', testData);
    }

    // 4. Check if we can access auth users table
    console.log('\n4. Testing auth users table access...');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users')
      .select('id, email')
      .limit(1);

    if (authUsersError) {
      console.log('❌ Auth users table error:', authUsersError.message);
    } else {
      console.log('✅ Auth users table accessible');
      console.log('   Users count:', authUsers.length);
    }

    // 5. Check RLS policies
    console.log('\n5. Testing RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('lats_products')
      .select('count')
      .limit(1);

    if (rlsError) {
      console.log('❌ RLS policy error:', rlsError.message);
      console.log('   This might indicate RLS is blocking access');
    } else {
      console.log('✅ RLS policies allow access');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug function
debugAuthStatus().then(() => {
  console.log('\n✅ Auth debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Auth debug failed:', error);
  process.exit(1);
});
