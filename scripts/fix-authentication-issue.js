import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixAuthenticationIssue() {
  console.log('🔐 LATS Authentication Issue Fix\n');
  
  try {
    // Check current authentication status
    console.log('1️⃣ Checking current authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
      console.log('   User ID:', user.id);
      console.log('   Role:', user.role);
    } else {
      console.log('ℹ️ No user is currently authenticated');
    }

    // Test database access without authentication
    console.log('\n2️⃣ Testing database access without authentication...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .limit(1);

    if (productsError) {
      console.log('❌ Database access error:', productsError.message);
      
      if (productsError.message.includes('row-level security')) {
        console.log('\n🔧 This is an RLS (Row Level Security) issue.');
        console.log('   The database requires authentication to access LATS tables.');
        console.log('\n📋 Solutions:');
        console.log('   1. Log in to the application first');
        console.log('   2. Ensure you have a valid user account');
        console.log('   3. Check that RLS policies are properly configured');
      }
    } else {
      console.log('✅ Database access successful (RLS might be disabled)');
    }

    // Check if there are any users in the auth system
    console.log('\n3️⃣ Checking for existing users...');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users')
      .select('id, email, role, is_active')
      .limit(5);

    if (authUsersError) {
      console.log('❌ Error checking auth_users:', authUsersError.message);
    } else if (authUsers && authUsers.length > 0) {
      console.log('✅ Found users in auth_users table:');
      authUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('ℹ️ No users found in auth_users table');
    }

    // Provide solution steps
    console.log('\n📋 SOLUTION STEPS:');
    console.log('==================');
    console.log('1. Open your application in the browser');
    console.log('2. Navigate to the login page');
    console.log('3. Log in with a valid user account');
    console.log('4. If you don\'t have an account, create one or contact your administrator');
    console.log('5. Once logged in, the LATS features should work properly');
    
    console.log('\n🔧 If you need to create a test user:');
    console.log('1. Go to Supabase Dashboard > Authentication > Users');
    console.log('2. Click "Add User"');
    console.log('3. Enter email and password');
    console.log('4. Set role to "authenticated"');
    console.log('5. Ensure the user is active');

    console.log('\n⚠️  IMPORTANT:');
    console.log('   The 400 Bad Request error occurs because the application');
    console.log('   is trying to access protected database tables without');
    console.log('   proper authentication. This is a security feature, not a bug.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixAuthenticationIssue();
