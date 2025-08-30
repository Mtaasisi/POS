const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function forceRecreateWhatsAppTables() {
  console.log('🔧 Force Recreating WhatsApp Tables');
  console.log('=====================================');

  try {
    // Step 1: Drop all tables in correct order
    console.log('🗑️ Step 1: Dropping existing tables...');
    
    const dropQueries = [
      'DROP TABLE IF EXISTS whatsapp_qr_codes CASCADE;',
      'DROP TABLE IF EXISTS whatsapp_connection_settings CASCADE;',
      'DROP TABLE IF EXISTS whatsapp_instances_comprehensive CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;'
    ];

    for (const query of dropQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.log(`⚠️ Warning during drop: ${error.message}`);
      } else {
        console.log(`✅ Dropped: ${query.split(' ')[2]}`);
      }
    }

    // Step 2: Create tables fresh
    console.log('\n📋 Step 2: Creating tables fresh...');

    const createTablesSQL = `
      -- Create WhatsApp Instances Comprehensive table
      CREATE TABLE whatsapp_instances_comprehensive (
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

      -- Create WhatsApp Connection Settings table
      CREATE TABLE whatsapp_connection_settings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        instance_id VARCHAR(50) NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
        webhook_url TEXT,
        webhook_url_token VARCHAR(255),
        mark_incoming_messages_readed VARCHAR(10) DEFAULT 'no',
        mark_incoming_messages_readed_on_reply VARCHAR(10) DEFAULT 'no',
        delay_send_messages_milliseconds INTEGER DEFAULT 1000,
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
        keep_online_status VARCHAR(10) DEFAULT 'no',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(instance_id)
      );

      -- Create WhatsApp QR Codes table
      CREATE TABLE whatsapp_qr_codes (
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

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
    if (createError) {
      console.error('❌ Error creating tables:', createError);
      return;
    }
    console.log('✅ Tables created successfully');

    // Step 3: Enable RLS
    console.log('\n🔒 Step 3: Enabling Row Level Security...');
    const rlsSQL = `
      ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled');
    }

    // Step 4: Create RLS Policies
    console.log('\n📋 Step 4: Creating RLS Policies...');
    const policiesSQL = `
      -- Policies for whatsapp_instances_comprehensive
      CREATE POLICY "Users can view their own instances" 
      ON whatsapp_instances_comprehensive FOR SELECT 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own instances" 
      ON whatsapp_instances_comprehensive FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own instances" 
      ON whatsapp_instances_comprehensive FOR UPDATE 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own instances" 
      ON whatsapp_instances_comprehensive FOR DELETE 
      USING (auth.uid() = user_id);

      -- Policies for whatsapp_connection_settings
      CREATE POLICY "Users can view their own settings" 
      ON whatsapp_connection_settings FOR SELECT 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own settings" 
      ON whatsapp_connection_settings FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own settings" 
      ON whatsapp_connection_settings FOR UPDATE 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own settings" 
      ON whatsapp_connection_settings FOR DELETE 
      USING (auth.uid() = user_id);

      -- Policies for whatsapp_qr_codes
      CREATE POLICY "Users can view their own qr codes" 
      ON whatsapp_qr_codes FOR SELECT 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can insert their own qr codes" 
      ON whatsapp_qr_codes FOR INSERT 
      WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own qr codes" 
      ON whatsapp_qr_codes FOR UPDATE 
      USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own qr codes" 
      ON whatsapp_qr_codes FOR DELETE 
      USING (auth.uid() = user_id);
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    if (policiesError) {
      console.error('❌ Error creating policies:', policiesError);
    } else {
      console.log('✅ RLS Policies created');
    }

    // Step 5: Create indexes
    console.log('\n📊 Step 5: Creating indexes...');
    const indexesSQL = `
      CREATE INDEX idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);
      CREATE INDEX idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);
      CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);
      CREATE INDEX idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);
      CREATE INDEX idx_whatsapp_instances_active ON whatsapp_instances_comprehensive(is_active);
      CREATE INDEX idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);
      CREATE INDEX idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);
      CREATE INDEX idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);
      CREATE INDEX idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    if (indexesError) {
      console.error('❌ Error creating indexes:', indexesError);
    } else {
      console.log('✅ Indexes created');
    }

    // Step 6: Create triggers
    console.log('\n⚡ Step 6: Creating triggers...');
    const triggersSQL = `
      -- Create function for updating timestamps
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Create triggers for automatic timestamp updates
      CREATE TRIGGER update_whatsapp_instances_updated_at 
      BEFORE UPDATE ON whatsapp_instances_comprehensive
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_whatsapp_settings_updated_at 
      BEFORE UPDATE ON whatsapp_connection_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      CREATE TRIGGER update_whatsapp_qr_updated_at 
      BEFORE UPDATE ON whatsapp_qr_codes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: triggersError } = await supabase.rpc('exec_sql', { sql: triggersSQL });
    if (triggersError) {
      console.error('❌ Error creating triggers:', triggersError);
    } else {
      console.log('✅ Triggers created');
    }

    // Step 7: Verify tables exist
    console.log('\n🔍 Step 7: Verifying tables...');
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['whatsapp_instances_comprehensive', 'whatsapp_connection_settings', 'whatsapp_qr_codes']);

    if (verifyError) {
      console.error('❌ Error verifying tables:', verifyError);
    } else {
      console.log('📋 Found tables:', tables?.map(t => t.table_name));
    }

    console.log('\n🎉 WhatsApp tables force recreated successfully!');
    console.log('✅ You can now use the WhatsApp Connection Manager');

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
forceRecreateWhatsAppTables();
