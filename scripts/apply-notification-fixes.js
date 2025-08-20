import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyNotificationFixes() {
  console.log('🔧 Applying notification foreign key fixes...');
  
  try {
    // SQL to fix foreign key references
    const fixSQL = `
      -- Drop existing foreign key constraints
      ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
      ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_actioned_by_fkey;
      ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_dismissed_by_fkey;

      ALTER TABLE notification_settings DROP CONSTRAINT IF EXISTS notification_settings_user_id_fkey;

      ALTER TABLE notification_actions DROP CONSTRAINT IF EXISTS notification_actions_performed_by_fkey;

      -- Add new foreign key constraints referencing auth_users
      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_actioned_by_fkey 
      FOREIGN KEY (actioned_by) REFERENCES auth_users(id) ON DELETE SET NULL;

      ALTER TABLE notifications 
      ADD CONSTRAINT notifications_dismissed_by_fkey 
      FOREIGN KEY (dismissed_by) REFERENCES auth_users(id) ON DELETE SET NULL;

      ALTER TABLE notification_settings 
      ADD CONSTRAINT notification_settings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE;

      ALTER TABLE notification_actions 
      ADD CONSTRAINT notification_actions_performed_by_fkey 
      FOREIGN KEY (performed_by) REFERENCES auth_users(id) ON DELETE CASCADE;
    `;

    // Try to execute the SQL using a different approach
    console.log('📝 Note: This script requires manual execution in Supabase dashboard');
    console.log('💡 Please run the following SQL in your Supabase SQL editor:');
    console.log('');
    console.log(fixSQL);
    console.log('');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/sql');
    console.log('📋 Copy and paste the SQL above, then click "Run"');
    console.log('✅ After running the SQL, you can test the notifications system');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
  }
}

// Run the script
applyNotificationFixes();
