#!/usr/bin/env node

/**
 * WhatsApp Connection Manager Database Migration Script
 * This script applies the new WhatsApp database schema
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required environment variables:');
  console.error('- VITE_SUPABASE_URL or REACT_APP_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

console.log('🔧 WhatsApp Connection Manager Migration');
console.log('=========================================');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTablesExist() {
  console.log('🔍 Checking if WhatsApp tables exist...');
  
  try {
    // Check tables using a direct query since information_schema might have issues
    const tables = ['whatsapp_instances_comprehensive', 'whatsapp_connection_settings', 'whatsapp_qr_codes'];
    const results = {};
    
    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
          .limit(1);
        
        results[tableName] = !error || error.code !== '42P01'; // 42P01 = relation does not exist
      } catch (err) {
        results[tableName] = false;
      }
    }

    console.log('📋 Table status:', results);
    return results;
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return null;
  }
}

async function runMigrationSQL() {
  console.log('🚀 Applying migration SQL...');
  
  // Split into smaller, more manageable statements
  const statements = [
    // Create WhatsApp Instances Comprehensive table
    `CREATE TABLE IF NOT EXISTS whatsapp_instances_comprehensive (
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
    );`,
    
    // Create WhatsApp Connection Settings table
    `CREATE TABLE IF NOT EXISTS whatsapp_connection_settings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      instance_id VARCHAR(50) NOT NULL,
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
    );`,
    
    // Create WhatsApp QR Codes table
    `CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      instance_id VARCHAR(50) NOT NULL,
      qr_code_base64 TEXT NOT NULL,
      qr_code_url TEXT,
      is_active BOOLEAN DEFAULT true,
      expires_at TIMESTAMP WITH TIME ZONE,
      scan_attempts INTEGER DEFAULT 0,
      max_scan_attempts INTEGER DEFAULT 5,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Enable RLS
    `ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;`,
    
    // Add foreign key constraint if it doesn't exist
    `DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'whatsapp_connection_settings_instance_id_fkey'
        ) THEN
            ALTER TABLE whatsapp_connection_settings 
            ADD CONSTRAINT whatsapp_connection_settings_instance_id_fkey 
            FOREIGN KEY (instance_id) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE;
        END IF;
    END $$;`,
    
    `DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'whatsapp_qr_codes_instance_id_fkey'
        ) THEN
            ALTER TABLE whatsapp_qr_codes 
            ADD CONSTRAINT whatsapp_qr_codes_instance_id_fkey 
            FOREIGN KEY (instance_id) REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE;
        END IF;
    END $$;`
  ];

  let success = true;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    try {
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error);
        success = false;
      } else {
        console.log(`✅ Statement ${i + 1} completed`);
      }
    } catch (err) {
      console.error(`❌ Exception in statement ${i + 1}:`, err);
      success = false;
    }
  }

  return success;
}

async function createRLSPolicies() {
  console.log('🔒 Creating RLS policies...');
  
  const policies = [
    // Instances policies
    `CREATE POLICY IF NOT EXISTS "Users can view their own instances" 
     ON whatsapp_instances_comprehensive FOR SELECT 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own instances" 
     ON whatsapp_instances_comprehensive FOR INSERT 
     WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can update their own instances" 
     ON whatsapp_instances_comprehensive FOR UPDATE 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can delete their own instances" 
     ON whatsapp_instances_comprehensive FOR DELETE 
     USING (auth.uid() = user_id);`,
    
    // Settings policies
    `CREATE POLICY IF NOT EXISTS "Users can view their own settings" 
     ON whatsapp_connection_settings FOR SELECT 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own settings" 
     ON whatsapp_connection_settings FOR INSERT 
     WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can update their own settings" 
     ON whatsapp_connection_settings FOR UPDATE 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can delete their own settings" 
     ON whatsapp_connection_settings FOR DELETE 
     USING (auth.uid() = user_id);`,
    
    // QR codes policies
    `CREATE POLICY IF NOT EXISTS "Users can view their own qr codes" 
     ON whatsapp_qr_codes FOR SELECT 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can insert their own qr codes" 
     ON whatsapp_qr_codes FOR INSERT 
     WITH CHECK (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can update their own qr codes" 
     ON whatsapp_qr_codes FOR UPDATE 
     USING (auth.uid() = user_id);`,
    
    `CREATE POLICY IF NOT EXISTS "Users can delete their own qr codes" 
     ON whatsapp_qr_codes FOR DELETE 
     USING (auth.uid() = user_id);`
  ];

  for (let i = 0; i < policies.length; i++) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policies[i] });
      if (error) {
        console.error(`❌ Error creating policy ${i + 1}:`, error);
      } else {
        console.log(`✅ Policy ${i + 1} created`);
      }
    } catch (err) {
      console.error(`❌ Exception creating policy ${i + 1}:`, err);
    }
  }
}

async function createIndexes() {
  console.log('📊 Creating indexes...');
  
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_active ON whatsapp_instances_comprehensive(is_active);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);`,
    `CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);`
  ];

  for (const index of indexes) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: index });
      if (error) {
        console.error(`❌ Error creating index:`, error);
      }
    } catch (err) {
      console.error(`❌ Exception creating index:`, err);
    }
  }
}

async function main() {
  console.log('🔧 Starting WhatsApp Connection Manager Migration\n');

  // Check current state
  const tableStatus = await checkTablesExist();
  
  if (!tableStatus) {
    console.error('❌ Unable to check table status');
    process.exit(1);
  }

  console.log('\n📊 Current table status:');
  console.log(`- whatsapp_instances_comprehensive: ${tableStatus.whatsapp_instances_comprehensive ? '✅' : '❌'}`);
  console.log(`- whatsapp_connection_settings: ${tableStatus.whatsapp_connection_settings ? '✅' : '❌'}`);
  console.log(`- whatsapp_qr_codes: ${tableStatus.whatsapp_qr_codes ? '✅' : '❌'}`);

  const allTablesExist = Object.values(tableStatus).every(exists => exists);

  if (allTablesExist) {
    console.log('\n✅ All WhatsApp tables already exist!');
    console.log('🎉 Migration not needed - your database is up to date.');
  } else {
    console.log('\n⚠️ Some tables are missing. Running migration...');
    
    const success = await runMigrationSQL();
    
    if (success) {
      console.log('✅ Tables created successfully');
      
      // Create RLS policies
      await createRLSPolicies();
      
      // Create indexes
      await createIndexes();
      
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 WhatsApp Connection Manager is ready to use.');
    } else {
      console.log('\n❌ Migration failed.');
      console.log('\n📝 You may need to apply the migration manually:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the SQL from database-migration.sql');
      console.log('4. Execute the SQL');
    }
  }

  // Final check
  console.log('\n🔍 Final verification...');
  const finalStatus = await checkTablesExist();
  
  if (finalStatus && Object.values(finalStatus).every(exists => exists)) {
    console.log('✅ All tables verified successfully!');
    console.log('\n🎯 WhatsApp Connection Manager is ready to use!');
    console.log('You can now:');
    console.log('- Access the WhatsApp Connection Manager page');
    console.log('- Add new WhatsApp instances');
    console.log('- Manage connection settings');
    console.log('- Generate QR codes for authentication');
  } else {
    console.log('❌ Some tables still missing. Please apply the migration manually.');
    console.log('\n📋 Manual migration steps:');
    console.log('1. Copy the SQL from the provided database-migration.sql file');
    console.log('2. Open your Supabase Dashboard');
    console.log('3. Go to SQL Editor');
    console.log('4. Paste and execute the SQL');
  }
}

main().catch(console.error);