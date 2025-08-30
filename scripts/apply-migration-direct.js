const { createClient } = require('@supabase/supabase-js');

// Using the same credentials from your supabaseClient.ts
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 Applying WhatsApp Connection Manager migration directly...');

  try {
    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase
      .from('whatsapp_instances_comprehensive')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ Tables already exist, migration not needed');
      return;
    }

    // Create comprehensive instances table
    console.log('📋 Creating whatsapp_instances_comprehensive table...');
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

    const { error: instancesError } = await supabase.rpc('exec_sql', {
      sql: createInstancesTableSQL
    });

    if (instancesError) {
      console.error('❌ Error creating instances table:', instancesError);
      throw instancesError;
    }

    // Create connection settings table
    console.log('📋 Creating whatsapp_connection_settings table...');
    const createSettingsTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_connection_settings (
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
      );
    `;

    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: createSettingsTableSQL
    });

    if (settingsError) {
      console.error('❌ Error creating settings table:', settingsError);
      throw settingsError;
    }

    // Create QR codes table
    console.log('📋 Creating whatsapp_qr_codes table...');
    const createQRTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
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
      );
    `;

    const { error: qrError } = await supabase.rpc('exec_sql', {
      sql: createQRTableSQL
    });

    if (qrError) {
      console.error('❌ Error creating QR codes table:', qrError);
      throw qrError;
    }

    console.log('✅ All tables created successfully!');

    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    const rlsSQL = `
      ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      throw rlsError;
    }

    console.log('✅ WhatsApp Connection Manager migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
applyMigration().then(() => {
  console.log('Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});
