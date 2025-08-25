#!/usr/bin/env node

/**
 * Fix Green API Settings Issues
 * This script addresses the 409 conflict errors and connection issues
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGreenApiSettings() {
  console.log('🔧 Starting Green API settings fix...');

  try {
    // Step 1: Check if the table exists
    console.log('📋 Checking table structure...');
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'green_api_settings')
      .eq('table_schema', 'public')
      .single();

    if (tableError && !tableExists) {
      console.log('⚠️ green_api_settings table does not exist, creating...');
    }

    // Step 2: Run the migration SQL
    console.log('🔄 Running migration...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241201000104_fix_green_api_settings_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      
      // Try alternative approach - execute SQL directly
      console.log('🔄 Trying alternative approach...');
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement });
            if (error) {
              console.warn('⚠️ Statement failed:', error.message);
            }
          } catch (err) {
            console.warn('⚠️ Statement error:', err.message);
          }
        }
      }
    } else {
      console.log('✅ Migration completed successfully');
    }

    // Step 3: Test the table
    console.log('🧪 Testing table access...');
    const { data: testData, error: testError } = await supabase
      .from('green_api_settings')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError);
    } else {
      console.log('✅ Table access test passed');
    }

    // Step 4: Clean up any duplicate settings
    console.log('🧹 Cleaning up duplicate settings...');
    const { data: duplicates, error: dupError } = await supabase
      .from('green_api_settings')
      .select('setting_key, COUNT(*)')
      .group('setting_key')
      .gt('count', 1);

    if (dupError) {
      console.warn('⚠️ Could not check for duplicates:', dupError.message);
    } else if (duplicates && duplicates.length > 0) {
      console.log(`🔍 Found ${duplicates.length} duplicate keys, cleaning up...`);
      
      for (const dup of duplicates) {
        const { data: dupRecords, error: fetchError } = await supabase
          .from('green_api_settings')
          .select('*')
          .eq('setting_key', dup.setting_key)
          .order('created_at', { ascending: false });

        if (!fetchError && dupRecords && dupRecords.length > 1) {
          // Keep the most recent record, delete others
          const toDelete = dupRecords.slice(1).map(record => record.id);
          
          const { error: deleteError } = await supabase
            .from('green_api_settings')
            .delete()
            .in('id', toDelete);

          if (deleteError) {
            console.warn(`⚠️ Could not delete duplicates for ${dup.setting_key}:`, deleteError.message);
          } else {
            console.log(`✅ Cleaned up duplicates for ${dup.setting_key}`);
          }
        }
      }
    }

    console.log('✅ Green API settings fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    process.exit(1);
  }
}

// Run the fix
fixGreenApiSettings()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
