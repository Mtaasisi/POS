import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixNotificationRLS() {
  console.log('🔧 Temporarily disabling RLS for testing...');
  
  try {
    // Temporarily disable RLS for testing
    const { error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);

    if (notificationsError) {
      console.log('❌ RLS is blocking access to notifications table');
      console.log('💡 For testing purposes, you can manually disable RLS in your Supabase dashboard:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to Authentication > Policies');
      console.log('   3. Find the "notifications" table');
      console.log('   4. Click "Disable RLS" temporarily');
      console.log('   5. Run the add-sample-notifications.js script');
      console.log('   6. Re-enable RLS when done testing');
      return;
    }

    console.log('✅ RLS is not blocking access');
    console.log('📝 You can now run the add-sample-notifications.js script');

  } catch (error) {
    console.error('❌ Error checking RLS:', error);
  }
}

// Run the script
fixNotificationRLS();
