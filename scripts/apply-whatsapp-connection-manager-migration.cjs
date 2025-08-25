const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔄 Applying WhatsApp Connection Manager migration...');

  try {
    // Create comprehensive instances table
    const createInstancesTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_instances_comprehensive (
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
      );
    `;

    const createSettingsTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_connection_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        instance_id VARCHAR(50) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        
        webhook_url TEXT,
        webhook_url_token VARCHAR(255),
        
        delay_send_messages_milliseconds INTEGER DEFAULT 1000,
        mark_incoming_messages_readed VARCHAR(3) DEFAULT 'no',
        mark_incoming_messages_readed_on_reply VARCHAR(3) DEFAULT 'no',
        
        outgoing_webhook VARCHAR(3) DEFAULT 'yes',
        outgoing_message_webhook VARCHAR(3) DEFAULT 'yes',
        outgoing_api_message_webhook VARCHAR(3) DEFAULT 'yes',
        incoming_webhook VARCHAR(3) DEFAULT 'yes',
        device_webhook VARCHAR(3) DEFAULT 'no',
        state_webhook VARCHAR(3) DEFAULT 'yes',
        poll_message_webhook VARCHAR(3) DEFAULT 'no',
        incoming_block_webhook VARCHAR(3) DEFAULT 'no',
        incoming_call_webhook VARCHAR(3) DEFAULT 'no',
        edited_message_webhook VARCHAR(3) DEFAULT 'no',
        deleted_message_webhook VARCHAR(3) DEFAULT 'no',
        
        keep_online_status VARCHAR(3) DEFAULT 'no',
        
        shared_session VARCHAR(3) DEFAULT 'no',
        status_instance_webhook VARCHAR(3) DEFAULT 'no',
        enable_messages_history VARCHAR(3) DEFAULT 'no',
        
        auto_sync_enabled BOOLEAN DEFAULT true,
        last_synced_at TIMESTAMP WITH TIME ZONE,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        UNIQUE(instance_id, user_id)
      );
    `;

    const createQRTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        instance_id VARCHAR(50) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        
        qr_code_base64 TEXT,
        qr_code_url TEXT,
        
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP WITH TIME ZONE,
        scan_attempts INTEGER DEFAULT 0,
        max_scan_attempts INTEGER DEFAULT 3,
        
        authorization_code VARCHAR(255),
        is_scanned BOOLEAN DEFAULT false,
        scanned_at TIMESTAMP WITH TIME ZONE,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);

      CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_user_id ON whatsapp_connection_settings(user_id);

      CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);
    `;

    const createTriggersSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER IF NOT EXISTS update_whatsapp_instances_updated_at 
          BEFORE UPDATE ON whatsapp_instances_comprehensive 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER IF NOT EXISTS update_whatsapp_settings_updated_at 
          BEFORE UPDATE ON whatsapp_connection_settings 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER IF NOT EXISTS update_whatsapp_qr_updated_at 
          BEFORE UPDATE ON whatsapp_qr_codes 
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    const enableRLSSQL = `
      ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;
    `;

    const createPoliciesSQL = `
      CREATE POLICY IF NOT EXISTS "Users can view their own instances" ON whatsapp_instances_comprehensive
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own instances" ON whatsapp_instances_comprehensive
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own instances" ON whatsapp_instances_comprehensive
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own instances" ON whatsapp_instances_comprehensive
          FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can view their own settings" ON whatsapp_connection_settings
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own settings" ON whatsapp_connection_settings
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own settings" ON whatsapp_connection_settings
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own settings" ON whatsapp_connection_settings
          FOR DELETE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can view their own QR codes" ON whatsapp_qr_codes
          FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can insert their own QR codes" ON whatsapp_qr_codes
          FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can update their own QR codes" ON whatsapp_qr_codes
          FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY IF NOT EXISTS "Users can delete their own QR codes" ON whatsapp_qr_codes
          FOR DELETE USING (auth.uid() = user_id);
    `;

    // Execute all SQL commands
    console.log('Creating tables...');
    await supabase.rpc('exec_sql', { sql: createInstancesTableSQL });
    await supabase.rpc('exec_sql', { sql: createSettingsTableSQL });
    await supabase.rpc('exec_sql', { sql: createQRTableSQL });
    
    console.log('Creating indexes...');
    await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    
    console.log('Creating triggers...');
    await supabase.rpc('exec_sql', { sql: createTriggersSQL });
    
    console.log('Enabling RLS...');
    await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    console.log('Creating policies...');
    await supabase.rpc('exec_sql', { sql: createPoliciesSQL });

    console.log('✅ WhatsApp Connection Manager migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  applyMigration()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { applyMigration };
