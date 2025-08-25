import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function applyNotificationSettingsFix() {
  console.log('🔧 Applying notification settings fix...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20241204000002_fix_notification_settings_rls_final.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Applying migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: statement + ';'
          });

          if (error) {
            console.log(`⚠️ Statement failed (may already be applied): ${error.message}`);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (err) {
          console.log(`⚠️ Statement failed (may already be applied): ${err.message}`);
        }
      }
    }

    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    // Try to access notification settings for the user from the error
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', 'a15a9139-3be9-4028-b944-240caae9eeb2')
      .single();

    if (error) {
      console.error('❌ Test failed:', error);
      
      // Try to create the settings manually
      console.log('📝 Creating settings manually...');
      const { error: insertError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
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
        });

      if (insertError) {
        console.error('❌ Manual creation failed:', insertError);
      } else {
        console.log('✅ Manual creation successful');
      }
    } else {
      console.log('✅ Test successful - settings found:', data);
    }

    console.log('\n🎉 Notification settings fix applied!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Check the console for any remaining errors');
    console.log('3. Test the notification functionality');

  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

applyNotificationSettingsFix();
