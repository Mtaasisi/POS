import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseErrors() {
  console.log('🔧 Fixing Database Errors...\n');

  try {
    // 1. Create whatsapp_notifications table if it doesn't exist
    console.log('📋 Creating whatsapp_notifications table...');
    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS whatsapp_notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
          order_id UUID,
          customer_phone VARCHAR(20) NOT NULL,
          template_type VARCHAR(50) NOT NULL,
          message TEXT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
          sent_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (notificationsError) {
      console.log('⚠️ whatsapp_notifications table creation failed (may already exist):', notificationsError.message);
    } else {
      console.log('✅ whatsapp_notifications table created');
    }

    // 2. Create notification_settings table if it doesn't exist
    console.log('📋 Creating notification_settings table...');
    const { error: settingsError } = await supabase.rpc('exec_sql', {
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

    if (settingsError) {
      console.log('⚠️ notification_settings table creation failed (may already exist):', settingsError.message);
    } else {
      console.log('✅ notification_settings table created');
    }

    // 3. Create indexes for better performance
    console.log('📋 Creating indexes...');
    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_customer_id ON whatsapp_notifications(customer_id);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_created_at ON whatsapp_notifications(created_at);
      `
    });

    if (indexesError) {
      console.log('⚠️ Index creation failed:', indexesError.message);
    } else {
      console.log('✅ Indexes created');
    }

    // 4. Enable RLS and create policies
    console.log('📋 Setting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
        ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON whatsapp_notifications FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON whatsapp_notifications FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON whatsapp_notifications FOR UPDATE USING (true);
        
        CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON notification_settings FOR SELECT USING (true);
        CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON notification_settings FOR INSERT WITH CHECK (true);
        CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON notification_settings FOR UPDATE USING (true);
      `
    });

    if (rlsError) {
      console.log('⚠️ RLS setup failed:', rlsError.message);
    } else {
      console.log('✅ RLS policies created');
    }

    // 5. Test the tables
    console.log('🧪 Testing table access...');
    
    // Test whatsapp_notifications
    const { data: notificationsTest, error: notificationsTestError } = await supabase
      .from('whatsapp_notifications')
      .select('*')
      .limit(1);
    
    if (notificationsTestError) {
      console.log('❌ whatsapp_notifications table test failed:', notificationsTestError.message);
    } else {
      console.log('✅ whatsapp_notifications table accessible');
    }

    // Test notification_settings
    const { data: settingsTest, error: settingsTestError } = await supabase
      .from('notification_settings')
      .select('*')
      .limit(1);
    
    if (settingsTestError) {
      console.log('❌ notification_settings table test failed:', settingsTestError.message);
    } else {
      console.log('✅ notification_settings table accessible');
    }

    // Test lats_sales
    const { data: salesTest, error: salesTestError } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (salesTestError) {
      console.log('❌ lats_sales table test failed:', salesTestError.message);
    } else {
      console.log('✅ lats_sales table accessible');
    }

    console.log('\n🎉 Database error fixes completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your application');
    console.log('2. Check the console for any remaining errors');
    console.log('3. Test the WhatsApp Hub functionality');

  } catch (error) {
    console.error('❌ Error fixing database issues:', error);
  }
}

fixDatabaseErrors();
