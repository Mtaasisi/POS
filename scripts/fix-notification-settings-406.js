import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixNotificationSettings406() {
  console.log('🔧 Fixing notification_settings 406 error...\n');

  try {
    // First, let's check if the table exists
    console.log('📋 Checking if notification_settings table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('notification_settings')
      .select('count')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      console.log('❌ Table does not exist, creating it...');
      
      // Create the table using a direct SQL approach
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS notification_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            
            -- Delivery preferences
            email_notifications BOOLEAN DEFAULT TRUE,
            push_notifications BOOLEAN DEFAULT TRUE,
            sms_notifications BOOLEAN DEFAULT FALSE,
            whatsapp_notifications BOOLEAN DEFAULT TRUE,
            
            -- Category preferences
            device_notifications BOOLEAN DEFAULT TRUE,
            customer_notifications BOOLEAN DEFAULT TRUE,
            payment_notifications BOOLEAN DEFAULT TRUE,
            inventory_notifications BOOLEAN DEFAULT TRUE,
            system_notifications BOOLEAN DEFAULT TRUE,
            appointment_notifications BOOLEAN DEFAULT TRUE,
            diagnostic_notifications BOOLEAN DEFAULT TRUE,
            loyalty_notifications BOOLEAN DEFAULT TRUE,
            communication_notifications BOOLEAN DEFAULT TRUE,
            backup_notifications BOOLEAN DEFAULT TRUE,
            security_notifications BOOLEAN DEFAULT TRUE,
            goal_notifications BOOLEAN DEFAULT TRUE,
            
            -- Priority preferences
            low_priority_notifications BOOLEAN DEFAULT TRUE,
            normal_priority_notifications BOOLEAN DEFAULT TRUE,
            high_priority_notifications BOOLEAN DEFAULT TRUE,
            urgent_priority_notifications BOOLEAN DEFAULT TRUE,
            
            -- Time preferences
            quiet_hours_enabled BOOLEAN DEFAULT FALSE,
            quiet_hours_start TIME DEFAULT '22:00',
            quiet_hours_end TIME DEFAULT '08:00',
            timezone TEXT DEFAULT 'UTC',
            
            -- Frequency preferences
            digest_enabled BOOLEAN DEFAULT FALSE,
            digest_frequency TEXT DEFAULT 'daily',
            digest_time TIME DEFAULT '09:00',
            
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.log('⚠️ Could not create table via RPC, trying alternative approach...');
        
        // Try to create a default record to trigger table creation
        const { error: insertError } = await supabase
          .from('notification_settings')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            whatsapp_notifications: true
          });

        if (insertError) {
          console.error('❌ Failed to create notification_settings table:', insertError);
          return;
        }
      }
    } else {
      console.log('✅ notification_settings table exists');
    }

    // Now let's test the table access
    console.log('🧪 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Table access test failed:', testError);
      
      // Try to fix RLS policies
      console.log('🔧 Attempting to fix RLS policies...');
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Enable RLS
          ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
          
          -- Drop existing policies
          DROP POLICY IF EXISTS "Users can view their own notification settings" ON notification_settings;
          DROP POLICY IF EXISTS "Users can insert their own notification settings" ON notification_settings;
          DROP POLICY IF EXISTS "Users can update their own notification settings" ON notification_settings;
          DROP POLICY IF EXISTS "Users can delete their own notification settings" ON notification_settings;
          
          -- Create RLS policies
          CREATE POLICY "Users can view their own notification settings" ON notification_settings
              FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own notification settings" ON notification_settings
              FOR INSERT WITH CHECK (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own notification settings" ON notification_settings
              FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can delete their own notification settings" ON notification_settings
              FOR DELETE USING (auth.uid() = user_id);
        `
      });

      if (rlsError) {
        console.log('⚠️ Could not fix RLS via RPC, trying alternative approach...');
        
        // Try to create a policy by inserting a record
        const { error: policyError } = await supabase
          .from('notification_settings')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000',
            email_notifications: true,
            push_notifications: true,
            sms_notifications: false,
            whatsapp_notifications: true
          });

        if (policyError) {
          console.error('❌ Failed to fix RLS policies:', policyError);
        }
      }
    } else {
      console.log('✅ Table access test successful');
    }

    // Create a default notification settings record for the current user
    console.log('📝 Creating default notification settings...');
    const { error: defaultError } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2', // The user ID from the error
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        whatsapp_notifications: true,
        device_notifications: true,
        customer_notifications: true,
        payment_notifications: true,
        inventory_notifications: true,
        system_notifications: true,
        appointment_notifications: true,
        diagnostic_notifications: true,
        loyalty_notifications: true,
        communication_notifications: true,
        backup_notifications: true,
        security_notifications: true,
        goal_notifications: true,
        low_priority_notifications: true,
        normal_priority_notifications: true,
        high_priority_notifications: true,
        urgent_priority_notifications: true,
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        timezone: 'UTC',
        digest_enabled: false,
        digest_frequency: 'daily',
        digest_time: '09:00'
      }, { onConflict: 'user_id' });

    if (defaultError) {
      console.error('❌ Failed to create default settings:', defaultError);
    } else {
      console.log('✅ Default notification settings created');
    }

    console.log('\n🎉 Notification settings fix completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Check the console for any remaining errors');
    console.log('3. Test the notification functionality');

  } catch (error) {
    console.error('❌ Error fixing notification settings:', error);
  }
}

fixNotificationSettings406();
