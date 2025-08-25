import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyWhatsAppSettingsMigration() {
  console.log('🔧 Applying WhatsApp Hub settings migration...');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250125000002_create_whatsapp_hub_settings_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Execute the migration
    console.log('🚀 Executing migration...');
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }

    console.log('✅ WhatsApp Hub settings migration applied successfully!');
    console.log('📋 Created table: whatsapp_hub_settings');
    console.log('🔐 Enabled Row Level Security (RLS)');
    console.log('📊 Created indexes for performance');
    console.log('⏰ Added automatic timestamp updates');

    // Verify the table was created
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'whatsapp_hub_settings');

    if (tableError) {
      console.error('❌ Error verifying table creation:', tableError);
      return;
    }

    if (tables && tables.length > 0) {
      console.log('✅ Table verification successful');
    } else {
      console.error('❌ Table verification failed - table not found');
    }

  } catch (error) {
    console.error('❌ Migration failed with error:', error);
  }
}

// Run the migration
applyWhatsAppSettingsMigration();
