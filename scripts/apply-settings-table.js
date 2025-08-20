import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySettingsTable() {
  try {
    console.log('🔧 Applying settings table to database...');

    // Create settings table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create Settings Table
        CREATE TABLE IF NOT EXISTS settings (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            key VARCHAR(255) NOT NULL UNIQUE,
            value TEXT NOT NULL,
            description TEXT,
            category VARCHAR(100) DEFAULT 'general',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (createTableError) {
      console.error('❌ Error creating settings table:', createTableError);
      return;
    }

    console.log('✅ Settings table created successfully');

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
        CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
      `
    });

    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      return;
    }

    console.log('✅ Indexes created successfully');

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE settings ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      return;
    }

    console.log('✅ RLS enabled for settings table');

    // Create policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to read settings" 
        ON settings FOR SELECT 
        TO authenticated 
        USING (true);

        CREATE POLICY "Allow admin users to manage settings" 
        ON settings FOR ALL 
        TO authenticated 
        USING (
            EXISTS (
                SELECT 1 FROM auth.users 
                WHERE auth.users.id = auth.uid() 
                AND auth.users.raw_user_meta_data->>'role' = 'admin'
            )
        );
      `
    });

    if (policyError) {
      console.error('❌ Error creating policies:', policyError);
      return;
    }

    console.log('✅ Policies created for settings table');

    // Create trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_settings_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_settings_updated_at
            BEFORE UPDATE ON settings
            FOR EACH ROW
            EXECUTE FUNCTION update_settings_updated_at();
      `
    });

    if (triggerError) {
      console.error('❌ Error creating trigger:', triggerError);
      return;
    }

    console.log('✅ Trigger created for settings table');

    // Insert default settings
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO settings (key, value, description, category) VALUES
        ('attendance', '{"enabled": true, "requireLocation": true, "requireWifi": true, "allowMobileData": true, "gpsAccuracy": 50, "checkInRadius": 100, "checkInTime": "08:00", "checkOutTime": "17:00", "gracePeriod": 15, "offices": [{"name": "Arusha Main Office", "lat": -3.359178, "lng": 36.661366, "radius": 100, "address": "Main Office, Arusha, Tanzania", "networks": [{"ssid": "Office_WiFi", "bssid": "00:11:22:33:44:55", "description": "Main office WiFi network"}, {"ssid": "Office_Guest", "description": "Guest WiFi network"}, {"ssid": "4G_Mobile", "description": "Mobile data connection"}]}]}', 'Attendance tracking settings', 'attendance'),
        ('whatsapp_green_api_key', '', 'WhatsApp Green API Key', 'whatsapp'),
        ('whatsapp_instance_id', '', 'WhatsApp Instance ID', 'whatsapp'),
        ('whatsapp_api_url', '', 'WhatsApp API URL', 'whatsapp'),
        ('whatsapp_media_url', '', 'WhatsApp Media URL', 'whatsapp'),
        ('whatsapp_enable_bulk', 'true', 'Enable bulk WhatsApp messages', 'whatsapp'),
        ('whatsapp_enable_auto', 'true', 'Enable automatic WhatsApp messages', 'whatsapp'),
        ('whatsapp_log_retention_days', '365', 'WhatsApp log retention days', 'whatsapp'),
        ('whatsapp_notification_email', '', 'WhatsApp notification email', 'whatsapp'),
        ('whatsapp_webhook_url', '', 'WhatsApp webhook URL', 'whatsapp'),
        ('whatsapp_enable_realtime', 'true', 'Enable real-time WhatsApp updates', 'whatsapp')
        ON CONFLICT (key) DO NOTHING;
      `
    });

    if (insertError) {
      console.error('❌ Error inserting default settings:', insertError);
      return;
    }

    console.log('✅ Default settings inserted successfully');

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('settings')
      .select('key, value')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing settings table:', testError);
      return;
    }

    console.log('✅ Settings table test successful');
    console.log('📊 Test data:', testData);

    console.log('🎉 Settings table setup completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
applySettingsTable();
