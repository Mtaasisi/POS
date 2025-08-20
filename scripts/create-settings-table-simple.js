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

async function createSettingsTable() {
  try {
    console.log('🔧 Creating settings table...');

    // First, let's check if the table already exists
    const { data: existingData, error: checkError } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('📋 Settings table does not exist. Please run the following SQL in your Supabase SQL Editor:');
      console.log('');
      console.log('-- Create Settings Table');
      console.log('CREATE TABLE IF NOT EXISTS settings (');
      console.log('    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,');
      console.log('    key VARCHAR(255) NOT NULL UNIQUE,');
      console.log('    value TEXT NOT NULL,');
      console.log('    description TEXT,');
      console.log('    category VARCHAR(100) DEFAULT \'general\',');
      console.log('    is_active BOOLEAN DEFAULT true,');
      console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.log(');');
      console.log('');
      console.log('-- Create indexes');
      console.log('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);');
      console.log('CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);');
      console.log('');
      console.log('-- Enable RLS');
      console.log('ALTER TABLE settings ENABLE ROW LEVEL SECURITY;');
      console.log('');
      console.log('-- Create policies');
      console.log('CREATE POLICY "Allow authenticated users to read settings"');
      console.log('ON settings FOR SELECT');
      console.log('TO authenticated');
      console.log('USING (true);');
      console.log('');
      console.log('CREATE POLICY "Allow admin users to manage settings"');
      console.log('ON settings FOR ALL');
      console.log('TO authenticated');
      console.log('USING (');
      console.log('    EXISTS (');
      console.log('        SELECT 1 FROM auth.users');
      console.log('        WHERE auth.users.id = auth.uid()');
      console.log('        AND auth.users.raw_user_meta_data->>\'role\' = \'admin\'');
      console.log('    )');
      console.log(');');
      console.log('');
      console.log('-- Insert default settings');
      console.log('INSERT INTO settings (key, value, description, category) VALUES');
      console.log('(\'attendance\', \'{"enabled": true, "requireLocation": true, "requireWifi": true, "allowMobileData": true, "gpsAccuracy": 50, "checkInRadius": 100, "checkInTime": "08:00", "checkOutTime": "17:00", "gracePeriod": 15, "offices": [{"name": "Arusha Main Office", "lat": -3.359178, "lng": 36.661366, "radius": 100, "address": "Main Office, Arusha, Tanzania", "networks": [{"ssid": "Office_WiFi", "bssid": "00:11:22:33:44:55", "description": "Main office WiFi network"}, {"ssid": "Office_Guest", "description": "Guest WiFi network"}, {"ssid": "4G_Mobile", "description": "Mobile data connection"}]}]}\', \'Attendance tracking settings\', \'attendance\'),');
      console.log('(\'whatsapp_green_api_key\', \'\', \'WhatsApp Green API Key\', \'whatsapp\'),');
      console.log('(\'whatsapp_instance_id\', \'\', \'WhatsApp Instance ID\', \'whatsapp\'),');
      console.log('(\'whatsapp_api_url\', \'\', \'WhatsApp API URL\', \'whatsapp\'),');
      console.log('(\'whatsapp_media_url\', \'\', \'WhatsApp Media URL\', \'whatsapp\'),');
      console.log('(\'whatsapp_enable_bulk\', \'true\', \'Enable bulk WhatsApp messages\', \'whatsapp\'),');
      console.log('(\'whatsapp_enable_auto\', \'true\', \'Enable automatic WhatsApp messages\', \'whatsapp\'),');
      console.log('(\'whatsapp_log_retention_days\', \'365\', \'WhatsApp log retention days\', \'whatsapp\'),');
      console.log('(\'whatsapp_notification_email\', \'\', \'WhatsApp notification email\', \'whatsapp\'),');
      console.log('(\'whatsapp_webhook_url\', \'\', \'WhatsApp webhook URL\', \'whatsapp\'),');
      console.log('(\'whatsapp_enable_realtime\', \'true\', \'Enable real-time WhatsApp updates\', \'whatsapp\')');
      console.log('ON CONFLICT (key) DO NOTHING;');
      console.log('');
      console.log('✅ After running the SQL above, the settings table will be created and the 406 errors should be resolved.');
    } else if (checkError) {
      console.error('❌ Error checking settings table:', checkError);
    } else {
      console.log('✅ Settings table already exists!');
      console.log('📊 Found settings:', existingData?.length || 0);
      
      // Test the attendance setting specifically
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'attendance')
        .single();

      if (attendanceError) {
        console.log('⚠️ Attendance setting not found, inserting it...');
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            key: 'attendance',
            value: JSON.stringify({
              enabled: true,
              requireLocation: true,
              requireWifi: true,
              allowMobileData: true,
              gpsAccuracy: 50,
              checkInRadius: 100,
              checkInTime: '08:00',
              checkOutTime: '17:00',
              gracePeriod: 15,
              offices: [{
                name: 'Arusha Main Office',
                lat: -3.359178,
                lng: 36.661366,
                radius: 100,
                address: 'Main Office, Arusha, Tanzania',
                networks: [
                  {
                    ssid: 'Office_WiFi',
                    bssid: '00:11:22:33:44:55',
                    description: 'Main office WiFi network'
                  },
                  {
                    ssid: 'Office_Guest',
                    description: 'Guest WiFi network'
                  },
                  {
                    ssid: '4G_Mobile',
                    description: 'Mobile data connection'
                  }
                ]
              }]
            }),
            description: 'Attendance tracking settings',
            category: 'attendance'
          });

        if (insertError) {
          console.error('❌ Error inserting attendance setting:', insertError);
        } else {
          console.log('✅ Attendance setting inserted successfully');
        }
      } else {
        console.log('✅ Attendance setting found:', attendanceData);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the function
createSettingsTable();
