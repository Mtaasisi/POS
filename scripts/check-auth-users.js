import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users table...');
  
  try {
    // Check if we can access auth.users
    const { data: authUsers, error: authError } = await supabase
      .from('auth_users')
      .select('id, name, email')
      .limit(5);

    if (authError) {
      console.error('❌ Error accessing auth_users:', authError);
      return;
    }

    console.log('✅ Found users in auth_users:');
    authUsers?.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log('');
    });

    // Try to get the specific user we want to use
    const targetUserId = '3f2d2ce5-243c-41c0-a162-248bd70b40bd';
    const { data: targetUser, error: targetError } = await supabase
      .from('auth_users')
      .select('id, name, email')
      .eq('id', targetUserId)
      .single();

    if (targetError) {
      console.error('❌ Error getting target user:', targetError);
      return;
    }

    if (targetUser) {
      console.log('✅ Target user found:');
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Name: ${targetUser.name || 'N/A'}`);
      console.log(`   Email: ${targetUser.email || 'N/A'}`);
    } else {
      console.log('❌ Target user not found');
    }

  } catch (error) {
    console.error('❌ Error checking auth users:', error);
  }
}

// Run the script
checkAuthUsers();
