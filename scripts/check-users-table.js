import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkUsersTable() {
  console.log('🔍 Checking for users table...');
  
  try {
    // Try to access the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ users table error:', usersError.message);
    } else {
      console.log('✅ users table exists and accessible');
    }

    // Try to access auth_users table
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth_users')
      .select('*')
      .limit(1);

    if (authUsersError) {
      console.log('❌ auth_users table error:', authUsersError.message);
    } else {
      console.log('✅ auth_users table exists and accessible');
    }

    // Check if we can access the notifications table
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (notificationsError) {
      console.log('❌ notifications table error:', notificationsError.message);
    } else {
      console.log('✅ notifications table exists and accessible');
    }

    console.log('\n💡 The issue is likely that the notifications table references auth.users(id)');
    console.log('   but we need to either:');
    console.log('   1. Create a users table that mirrors auth_users');
    console.log('   2. Update the foreign key to reference auth_users(id)');
    console.log('   3. Use the service role key to bypass foreign key constraints');

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the script
checkUsersTable();
