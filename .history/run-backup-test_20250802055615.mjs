#!/usr/bin/env node

/**
 * Simple backup test with detailed logging
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
async function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, 'backup.env');
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
    
    return envVars;
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return {};
  }
}

async function runBackupTest() {
  console.log('🚀 Starting backup test...');
  
  try {
    // Load environment variables
    const envVars = await loadEnvVars();
    console.log('✅ Environment variables loaded');
    
    // Initialize Supabase
    const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
    
    // Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups', timestamp);
    await fs.mkdir(backupDir, { recursive: true });
    console.log(`✅ Backup directory created: ${backupDir}`);
    
    // Get all tables
    console.log('📋 Getting table list...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%');
    
    if (tablesError) {
      console.log('⚠️  Could not get tables from information_schema, trying direct approach...');
      
      // Try direct table access
      const knownTables = ['customers', 'devices', 'customer_payments', 'device_remarks', 'device_transitions'];
      let totalRecords = 0;
      
      for (const tableName of knownTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) {
            console.log(`⚠️  Could not access ${tableName}: ${error.message}`);
          } else {
            const recordCount = data?.length || 0;
            totalRecords += recordCount;
            console.log(`✅ ${tableName}: ${recordCount} records`);
            
            // Save table backup
            const tableBackupPath = path.join(backupDir, `${tableName}.json`);
            await fs.writeFile(tableBackupPath, JSON.stringify({ tableName, data: data || [], error: null }, null, 2));
            console.log(`💾 Saved ${tableName} backup`);
          }
        } catch (error) {
          console.log(`❌ Error with ${tableName}: ${error.message}`);
        }
      }
      
      console.log(`📊 Total records backed up: ${totalRecords}`);
    } else {
      console.log(`📋 Found ${tables?.length || 0} tables`);
      
      // Export each table
      let totalRecords = 0;
      for (const table of tables || []) {
        const tableName = table.table_name;
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) {
            console.log(`⚠️  Could not access ${tableName}: ${error.message}`);
          } else {
            const recordCount = data?.length || 0;
            totalRecords += recordCount;
            console.log(`✅ ${tableName}: ${recordCount} records`);
            
            // Save table backup
            const tableBackupPath = path.join(backupDir, `${tableName}.json`);
            await fs.writeFile(tableBackupPath, JSON.stringify({ tableName, data: data || [], error: null }, null, 2));
            console.log(`💾 Saved ${tableName} backup`);
          }
        } catch (error) {
          console.log(`❌ Error with ${tableName}: ${error.message}`);
        }
      }
      
      console.log(`📊 Total records backed up: ${totalRecords}`);
    }
    
    // Create backup summary
    const summary = {
      timestamp,
      totalRecords: totalRecords || 0,
      backupDir
    };
    
    const summaryPath = path.join(backupDir, 'backup_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Backup summary saved: ${summaryPath}`);
    
    console.log('✅ Backup test completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    
  } catch (error) {
    console.error('❌ Backup test failed:', error);
  }
}

// Run the test
runBackupTest(); 