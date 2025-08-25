#!/usr/bin/env node

/**
 * WhatsApp Database Cleanup Executor
 * 
 * This script executes the comprehensive WhatsApp cleanup migration
 * to remove all WhatsApp-related database structures and data.
 * 
 * Run this after backing up your database!
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration!');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runCleanupMigration() {
  console.log('🗑️  WhatsApp Database Cleanup');
  console.log('============================\n');
  
  console.log('⚠️  WARNING: This will permanently remove all WhatsApp-related data!');
  console.log('📋 This includes:');
  console.log('   • All WhatsApp tables and data');
  console.log('   • WhatsApp columns from existing tables');
  console.log('   • WhatsApp settings and configurations');
  console.log('   • WhatsApp-related functions and indexes');
  console.log('   • WhatsApp audit logs and preferences\n');
  
  console.log('💾 IMPORTANT: Make sure you have a database backup before proceeding!\n');
  
  // Read the cleanup migration
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250126000000_complete_whatsapp_cleanup.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Cleanup migration file not found:', migrationPath);
    process.exit(1);
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('❓ Do you want to proceed with the WhatsApp cleanup? (y/N)');
  
  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async (key) => {
    const input = key.toString().toLowerCase();
    
    if (input === 'y') {
      console.log('\n🚀 Starting WhatsApp database cleanup...\n');
      
      try {
        // Execute the cleanup migration
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: migrationSQL
        });
        
        if (error) {
          console.error('❌ Migration failed:', error.message);
          process.exit(1);
        }
        
        console.log('✅ Database cleanup completed successfully!\n');
        
        // Verify cleanup
        console.log('🔍 Verifying cleanup...\n');
        
        // Check for remaining WhatsApp tables
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .ilike('table_name', '%whatsapp%');
        
        if (tables && tables.length > 0) {
          console.log('⚠️  Warning: Some WhatsApp tables still exist:', tables.map(t => t.table_name));
        } else {
          console.log('✅ No WhatsApp tables found');
        }
        
        // Check for remaining WhatsApp columns
        const { data: columns } = await supabase
          .from('information_schema.columns')
          .select('table_name, column_name')
          .ilike('column_name', '%whatsapp%');
        
        if (columns && columns.length > 0) {
          console.log('⚠️  Warning: Some WhatsApp columns still exist:', columns);
        } else {
          console.log('✅ No WhatsApp columns found');
        }
        
        console.log('\n🎉 WhatsApp cleanup verification completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Test your application to ensure everything works');
        console.log('2. Remove old WhatsApp migration files using: node scripts/cleanup-whatsapp-migrations.js');
        console.log('3. Update your application documentation');
        
      } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
      }
      
    } else {
      console.log('\n❌ Cleanup cancelled.');
    }
    
    process.exit(0);
  });
}

// Helper function to execute raw SQL (if not available as RPC)
async function executeSQLDirect(sql) {
  // Split SQL into individual statements
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  for (const statement of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() + ';' });
    if (error) {
      throw error;
    }
  }
}

// Run the cleanup
runCleanupMigration().catch(console.error);
