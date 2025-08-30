const { createClient } = require('@supabase/supabase-js');

// Using the same credentials from your supabaseClient.ts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔄 Creating WhatsApp Connection Manager tables...');

  try {
    // Check if tables already exist by trying to select from them
    const { data: existingTables, error: checkError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tables already exist!');
      
      // Check if we have any test data
      const { data: instances, error: instancesError } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*');
        
      if (!instancesError) {
        console.log(`📊 Found ${instances.length} existing instances`);
      }
      
      return;
    }

    console.log('📋 Tables do not exist, they need to be created via Supabase Dashboard...');
    console.log('');
    console.log('🔧 MANUAL SETUP REQUIRED:');
    console.log('');
    console.log('Please go to your Supabase Dashboard and run this SQL:');
    console.log('');
    console.log('-- Create WhatsApp Instances Comprehensive table');
    console.log(`CREATE TABLE IF NOT EXISTS whatsapp_instances_comprehensive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  instance_id VARCHAR(50) NOT NULL UNIQUE,
  api_token VARCHAR(255) NOT NULL,
  instance_name VARCHAR(100),
  description TEXT,
  
  green_api_host VARCHAR(255) DEFAULT 'https://api.green-api.com',
  green_api_url VARCHAR(255),
  
  state_instance VARCHAR(50) DEFAULT 'notAuthorized',
  status VARCHAR(50) DEFAULT 'disconnected',
  phone_number VARCHAR(20),
  wid VARCHAR(50),
  country_instance VARCHAR(10),
  type_account VARCHAR(50),
  
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  
  profile_name VARCHAR(100),
  profile_picture_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    console.log('');
    console.log('-- Create WhatsApp Connection Settings table');
    console.log(`CREATE TABLE IF NOT EXISTS whatsapp_connection_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id VARCHAR(50) NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
  
  -- Webhook configuration
  webhook_url TEXT,
  webhook_url_token VARCHAR(255),
  
  -- Message settings
  mark_incoming_messages_readed VARCHAR(10) DEFAULT 'no',
  mark_incoming_messages_readed_on_reply VARCHAR(10) DEFAULT 'no',
  delay_send_messages_milliseconds INTEGER DEFAULT 1000,
  
  -- Webhook notification settings
  incoming_webhook VARCHAR(10) DEFAULT 'yes',
  outgoing_webhook VARCHAR(10) DEFAULT 'yes',
  outgoing_message_webhook VARCHAR(10) DEFAULT 'yes',
  outgoing_api_message_webhook VARCHAR(10) DEFAULT 'yes',
  state_webhook VARCHAR(10) DEFAULT 'yes',
  device_webhook VARCHAR(10) DEFAULT 'yes',
  incoming_call_webhook VARCHAR(10) DEFAULT 'no',
  poll_message_webhook VARCHAR(10) DEFAULT 'no',
  edited_message_webhook VARCHAR(10) DEFAULT 'no',
  deleted_message_webhook VARCHAR(10) DEFAULT 'no',
  incoming_block_webhook VARCHAR(10) DEFAULT 'no',
  
  -- Status settings
  keep_online_status VARCHAR(10) DEFAULT 'no',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instance_id)
);`);
    console.log('');
    console.log('-- Create WhatsApp QR Codes table');
    console.log(`CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id VARCHAR(50) NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
  
  qr_code_base64 TEXT NOT NULL,
  qr_code_url TEXT,
  
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  scan_attempts INTEGER DEFAULT 0,
  max_scan_attempts INTEGER DEFAULT 5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    console.log('');
    console.log('-- Enable Row Level Security');
    console.log(`ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;`);
    console.log('');
    console.log('-- Create RLS Policies');
    console.log(`-- Instances policies
CREATE POLICY "Users can view their own instances" ON whatsapp_instances_comprehensive FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own instances" ON whatsapp_instances_comprehensive FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own instances" ON whatsapp_instances_comprehensive FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own instances" ON whatsapp_instances_comprehensive FOR DELETE USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view their own settings" ON whatsapp_connection_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON whatsapp_connection_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON whatsapp_connection_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON whatsapp_connection_settings FOR DELETE USING (auth.uid() = user_id);

-- QR codes policies
CREATE POLICY "Users can view their own qr codes" ON whatsapp_qr_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own qr codes" ON whatsapp_qr_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own qr codes" ON whatsapp_qr_codes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own qr codes" ON whatsapp_qr_codes FOR DELETE USING (auth.uid() = user_id);`);
    console.log('');
    console.log('-- Create indexes for performance');
    console.log(`CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_active ON whatsapp_instances_comprehensive(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);`);
    console.log('');
    console.log('🌐 Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('👆 Copy and paste the SQL above in the SQL editor and run it');
    console.log('');

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the check
createTables().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
