import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCustomerCheckinsMigration() {
  try {
    console.log('🚀 Applying customer_checkins table migration...');
    
    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250131000070_create_customer_checkins_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded, executing...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Error applying migration:', error);
      return;
    }
    
    console.log('✅ Customer checkins table migration applied successfully!');
    console.log('📊 Migration result:', data);
    
    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'customer_checkins')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.warn('⚠️ Could not verify table creation:', tableError);
    } else if (tables && tables.length > 0) {
      console.log('✅ customer_checkins table verified successfully!');
    } else {
      console.log('⚠️ customer_checkins table not found in verification');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
applyCustomerCheckinsMigration();
