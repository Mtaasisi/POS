import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixNotificationForeignKeyIssue() {
  console.log('🔧 Fixing notification foreign key constraint issue...\n');

  try {
    // First, let's check what tables exist
    console.log('📋 Checking available tables...');
    
    // Test if auth.users exists
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('auth.users')
        .select('id')
        .limit(1);
      
      if (authUsersError) {
        console.log('❌ auth.users table not accessible:', authUsersError.message);
      } else {
        console.log('✅ auth.users table exists and accessible');
      }
    } catch (err) {
      console.log('❌ Cannot access auth.users directly:', err.message);
    }

    // Test if auth_users exists
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('auth_users')
        .select('id')
        .limit(1);
      
      if (authUsersError) {
        console.log('❌ auth_users table not accessible:', authUsersError.message);
      } else {
        console.log('✅ auth_users table exists and accessible');
      }
    } catch (err) {
      console.log('❌ Cannot access auth_users directly:', err.message);
    }

    // Check the current user
    console.log('\n👤 Checking current authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ No authenticated user found');
      console.log('💡 This is expected in a script context');
    } else {
      console.log(`✅ Found authenticated user: ${user.email} (ID: ${user.id})`);
      
      // Test if this user exists in auth_users
      try {
        const { data: userData, error: userDataError } = await supabase
          .from('auth_users')
          .select('id, email')
          .eq('id', user.id)
          .single();

        if (userDataError) {
          console.log('❌ User not found in auth_users table:', userDataError.message);
        } else {
          console.log('✅ User found in auth_users table:', userData);
        }
      } catch (err) {
        console.log('❌ Cannot check auth_users table:', err.message);
      }
    }

    // Test the problematic user ID from the error
    const problematicUserId = '1ede020a-61c3-4697-9d82-07cefbffc8ab';
    console.log(`\n🔍 Checking problematic user ID: ${problematicUserId}`);
    
    try {
      const { data: problemUserData, error: problemUserError } = await supabase
        .from('auth_users')
        .select('id, email')
        .eq('id', problematicUserId)
        .single();

      if (problemUserError) {
        console.log('❌ Problematic user not found in auth_users:', problemUserError.message);
      } else {
        console.log('✅ Problematic user found in auth_users:', problemUserData);
      }
    } catch (err) {
      console.log('❌ Cannot check problematic user in auth_users:', err.message);
    }

    // Check notification_settings table structure
    console.log('\n📋 Checking notification_settings table structure...');
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .limit(1);

      if (settingsError) {
        console.log('❌ Cannot access notification_settings:', settingsError.message);
      } else {
        console.log('✅ notification_settings table accessible');
        if (settingsData && settingsData.length > 0) {
          console.log('📋 Sample record:', settingsData[0]);
        }
      }
    } catch (err) {
      console.log('❌ Cannot access notification_settings:', err.message);
    }

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('=====================');
    console.log('The foreign key constraint issue is likely caused by:');
    console.log('1. Mismatch between auth.users and auth_users tables');
    console.log('2. User ID not existing in the referenced table');
    console.log('3. Incorrect foreign key constraint reference');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('=====================');
    console.log('1. Check if auth_users table exists and contains the user');
    console.log('2. Update foreign key constraint to reference the correct table');
    console.log('3. Ensure user authentication is properly set up');
    console.log('4. Consider removing foreign key constraint if not needed');
    
    console.log('\n💡 MANUAL FIX REQUIRED:');
    console.log('======================');
    console.log('Please run the following SQL in your Supabase dashboard:');
    console.log('');
    console.log('-- Option 1: Remove foreign key constraint (recommended)');
    console.log('ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;');
    console.log('');
    console.log('-- Option 2: Update foreign key to reference auth.users');
    console.log('ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;');
    console.log('ALTER TABLE notification_settings ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('');
    console.log('-- Option 3: Create auth_users table if it doesn\'t exist');
    console.log('CREATE TABLE IF NOT EXISTS auth_users (id UUID PRIMARY KEY, email TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

fixNotificationForeignKeyIssue();
