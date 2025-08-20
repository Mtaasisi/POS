import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function getUserID() {
  console.log('👤 Getting user ID from database...');
  
  try {
    // Get users from auth_users table
    const { data: users, error: usersError } = await supabase
      .from('auth_users')
      .select('id, name, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in the database');
      return;
    }

    console.log('✅ Found users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log('');
    });

    console.log('💡 Copy one of the user IDs above and update the add-sample-notifications.js script');

  } catch (error) {
    console.error('❌ Error getting user ID:', error);
  }
}

// Run the script
getUserID();
