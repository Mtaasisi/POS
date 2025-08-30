#!/usr/bin/env node

/**
 * WhatsApp Connection Manager Database Migration Script
 * This script applies the new WhatsApp database schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const migrationSQL = `
-- WhatsApp Connection Manager Database Migration
-- Copy and paste this entire SQL into your Supabase Dashboard SQL Editor

-- Create WhatsApp Instances Comprehensive table
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

-- Create WhatsApp Connection Settings table
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

-- Create WhatsApp QR Codes table
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

-- Enable Row Level Security
ALTER TABLE whatsapp_instances_comprehensive ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_connection_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for whatsapp_instances_comprehensive
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

-- Create RLS Policies for whatsapp_connection_settings
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

-- Create RLS Policies for whatsapp_qr_codes
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances_comprehensive(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_id ON whatsapp_instances_comprehensive(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances_comprehensive(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_state ON whatsapp_instances_comprehensive(state_instance);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_active ON whatsapp_instances_comprehensive(is_active);

CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_instance_id ON whatsapp_connection_settings(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_user_id ON whatsapp_qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_instance_id ON whatsapp_qr_codes(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_active ON whatsapp_qr_codes(is_active);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

async function checkTablesExist() {
  console.log('🔍 Checking if WhatsApp tables exist...');
  
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'whatsapp_instances_comprehensive',
        'whatsapp_connection_settings',
        'whatsapp_qr_codes'
      ]);

    if (error) {
      throw error;
    }

    const existingTables = tables?.map(t => t.table_name) || [];
    
    console.log('📋 Tables found:', existingTables);
    
    return {
      whatsapp_instances_comprehensive: existingTables.includes('whatsapp_instances_comprehensive'),
      whatsapp_connection_settings: existingTables.includes('whatsapp_connection_settings'),
      whatsapp_qr_codes: existingTables.includes('whatsapp_qr_codes')
    };
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    return null;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Applying WhatsApp Connection Manager migration...');
    
    const { error } = await supabase.rpc('exec', {
      sql: migrationSQL
    });

    if (error) {
      // Try alternative method if rpc fails
      console.log('⚠️ RPC method failed, trying direct SQL execution...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.query(statement);
          if (stmtError) {
            console.error(`❌ Error executing statement: ${statement.substring(0, 100)}...`);
            console.error(stmtError);
          }
        } catch (err) {
          console.error(`❌ Exception executing statement: ${statement.substring(0, 100)}...`);
          console.error(err);
        }
      }
    }

    console.log('✅ Migration completed');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return false;
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
    
    const success = await runMigration();
    
    if (success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 WhatsApp Connection Manager is ready to use.');
    } else {
      console.log('\n❌ Migration failed.');
      console.log('\n📝 Manual Steps:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the migration SQL from the provided file');
      console.log('4. Execute the SQL');
    }
  }

  // Final check
  console.log('\n🔍 Final verification...');
  const finalStatus = await checkTablesExist();
  
  if (finalStatus && Object.values(finalStatus).every(exists => exists)) {
    console.log('✅ All tables verified successfully!');
  } else {
    console.log('❌ Some tables still missing. Please apply the migration manually.');
  }
}

main().catch(console.error);
