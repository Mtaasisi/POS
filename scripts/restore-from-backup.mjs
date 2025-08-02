#!/usr/bin/env node

/**
 * Restore Supabase data from backup
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', 'backup.env');
const envContent = await fs.readFile(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY
);

async function restoreFromBackup(backupPath) {
  try {
    console.log(`🔄 Restoring from backup: ${backupPath}`);
    
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
    
    if (!backupData.data || !Array.isArray(backupData.data)) {
      throw new Error('Invalid backup format');
    }
    
    console.log(`📊 Found ${backupData.data.length} tables to restore`);
    
    for (const tableData of backupData.data) {
      if (tableData.error) {
        console.log(`⚠️  Skipping ${tableData.tableName} due to error: ${tableData.error}`);
        continue;
      }
      
      if (tableData.data.length === 0) {
        console.log(`📭 Skipping empty table: ${tableData.tableName}`);
        continue;
      }
      
      console.log(`🔄 Restoring ${tableData.tableName} (${tableData.data.length} records)...`);
      
      // Clear existing data
      const { error: deleteError } = await supabase
        .from(tableData.tableName)
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.log(`⚠️  Could not clear ${tableData.tableName}: ${deleteError.message}`);
      }
      
      // Insert backup data
      const { error: insertError } = await supabase
        .from(tableData.tableName)
        .insert(tableData.data);
      
      if (insertError) {
        console.error(`❌ Error restoring ${tableData.tableName}: ${insertError.message}`);
      } else {
        console.log(`✅ Restored ${tableData.tableName}`);
      }
    }
    
    console.log('✅ Restore completed successfully');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupPath = process.argv[2];
  
  if (!backupPath) {
    console.log('Usage: node restore-from-backup.mjs <backup-file-path>');
    console.log('');
    console.log('Example:');
    console.log('  node restore-from-backup.mjs backups/2025-01-15T10-30-00-000Z/complete_backup.json');
    exit(1);
  }
  
  restoreFromBackup(backupPath);
}
