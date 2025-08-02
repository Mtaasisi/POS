#!/usr/bin/env node

/**
 * Complete Backup Solution: Local + Dropbox
 * Combines local storage with cloud backup for maximum reliability
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabase: {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  },
  dropbox: {
    accessToken: null,
    backupFolder: '/Supabase Backups'
  },
  backup: {
    retentionDays: 30,
    compressBackups: true,
    backupDir: './backups'
  }
};

let supabase;

async function initializeSupabase() {
  supabase = createClient(config.supabase.url, config.supabase.anonKey);
  console.log('✅ Supabase client initialized');
}

/**
 * Get all tables from Supabase
 */
async function getAllTables() {
  try {
    const tables = [
      'customers', 'devices', 'payments', 'audit_logs', 'settings',
      'customer_notes', 'device_transitions', 'device_remarks',
      'communication_templates', 'sms_logs', 'user_daily_goals',
      'inventory_categories', 'products', 'product_variants',
      'spare_parts', 'stock_movements', 'suppliers'
    ];
    
    console.log(`📋 Found ${tables.length} tables to backup`);
    return tables;
  } catch (error) {
    console.error('❌ Error getting tables:', error);
    return [];
  }
}

/**
 * Backup a single table
 */
async function backupTable(tableName) {
  try {
    console.log(`📦 Backing up table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error backing up ${tableName}:`, error);
      return null;
    }
    
    const backup = {
      table: tableName,
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      data: data
    };
    
    console.log(`✅ Backed up ${tableName}: ${data.length} rows`);
    return backup;
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error);
    return null;
  }
}

/**
 * Create complete backup
 */
async function createBackup() {
  try {
    console.log('🚀 Starting backup process...');
    
    const tables = await getAllTables();
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      summary: {
        totalTables: tables.length,
        totalRows: 0,
        backupSize: 0
      },
      tables: {}
    };
    
    let totalRows = 0;
    
    // Backup each table
    for (const table of tables) {
      const tableBackup = await backupTable(table);
      if (tableBackup) {
        backupData.tables[table] = tableBackup;
        totalRows += tableBackup.rowCount;
      }
    }
    
    backupData.summary.totalRows = totalRows;
    
    // Create backup directory
    const backupDir = path.join(__dirname, config.backup.backupDir);
    await fs.mkdir(backupDir, { recursive: true });
    
    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    // Write backup file
    const backupContent = JSON.stringify(backupData, null, 2);
    await fs.writeFile(backupFile, backupContent);
    
    // Get file size
    const stats = await fs.stat(backupFile);
    backupData.summary.backupSize = stats.size;
    
    console.log(`✅ Backup created: ${backupFile}`);
    console.log(`📊 Summary: ${totalRows} total rows, ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return null;
  }
}

/**
 * Upload backup to Dropbox
 */
async function uploadToDropbox(backupFile) {
  try {
    if (!config.dropbox.accessToken) {
      console.log('⚠️ Dropbox not configured, skipping cloud backup');
      return false;
    }
    
    console.log('☁️ Uploading to Dropbox...');
    
    const fileName = path.basename(backupFile);
    const dropboxPath = `${config.dropbox.backupFolder}/${fileName}`;
    
    // Read the backup file
    const fileContent = await fs.readFile(backupFile);
    
    // Upload to Dropbox using the API
    const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.dropbox.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: dropboxPath,
          mode: 'add',
          autorename: true,
          mute: false
        })
      },
      body: fileContent
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error uploading to Dropbox:', errorText);
      return false;
    }
    
    const result = await response.json();
    console.log(`✅ Uploaded to Dropbox: ${result.path_display}`);
    return true;
  } catch (error) {
    console.error('❌ Error uploading to Dropbox:', error);
    return false;
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    console.log('🧹 Cleaning old backups...');
    
    const backupDir = path.join(__dirname, config.backup.backupDir);
    const files = await fs.readdir(backupDir);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.backup.retentionDays);
    
    let deletedCount = 0;
    let totalSizeDeleted = 0;
    
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          totalSizeDeleted += stats.size;
        }
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} old backup files (${(totalSizeDeleted / 1024 / 1024).toFixed(2)} MB freed)`);
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
  }
}

/**
 * Load environment variables
 */
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
    
    // Set Dropbox access token
    if (envVars.DROPBOX_ACCESS_TOKEN) {
      config.dropbox.accessToken = envVars.DROPBOX_ACCESS_TOKEN;
    }
    
    return envVars;
  } catch (error) {
    console.log('📝 No backup.env file found, using local backup only');
    return {};
  }
}

/**
 * List all backups (local and Dropbox)
 */
async function listAllBackups() {
  try {
    console.log('📋 Listing all backups...');
    
    // List local backups
    const backupDir = path.join(__dirname, config.backup.backupDir);
    const localFiles = await fs.readdir(backupDir);
    
    const localBackups = [];
    for (const file of localFiles) {
      if (file.startsWith('backup-') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        localBackups.push({
          name: file,
          size: stats.size,
          date: stats.mtime,
          location: 'Local'
        });
      }
    }
    
    // List Dropbox backups if configured
    let dropboxBackups = [];
    if (config.dropbox.accessToken) {
      try {
        const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.dropbox.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            path: config.dropbox.backupFolder,
            recursive: false
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          dropboxBackups = result.entries
            .filter(entry => entry.name.startsWith('backup-') && entry.name.endsWith('.json'))
            .map(entry => ({
              name: entry.name,
              size: entry.size,
              date: new Date(entry.server_modified),
              location: 'Dropbox'
            }));
        }
      } catch (error) {
        console.log('⚠️ Could not list Dropbox backups');
      }
    }
    
    // Combine and sort all backups
    const allBackups = [...localBackups, ...dropboxBackups];
    allBackups.sort((a, b) => b.date - a.date);
    
    console.log('📋 All backups:');
    console.log('='.repeat(80));
    
    for (const backup of allBackups) {
      const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
      const date = backup.date.toLocaleString();
      console.log(`${backup.name} | ${sizeMB} MB | ${date} | ${backup.location}`);
    }
    
    console.log('='.repeat(80));
    console.log(`Total: ${allBackups.length} backups (${localBackups.length} local, ${dropboxBackups.length} Dropbox)`);
    
    return allBackups;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
}

/**
 * Main backup function
 */
async function runCompleteBackup() {
  try {
    console.log('🔄 Starting complete backup (Local + Dropbox)...');
    
    await loadEnvVars();
    await initializeSupabase();
    
    // Create backup
    const backupFile = await createBackup();
    if (!backupFile) {
      console.error('❌ Failed to create backup');
      return;
    }
    
    // Upload to Dropbox
    await uploadToDropbox(backupFile);
    
    // Clean old backups
    await cleanOldBackups();
    
    console.log('🎉 Complete backup finished successfully!');
    console.log('💾 Local backup: ✅');
    console.log('☁️ Dropbox backup: ' + (config.dropbox.accessToken ? '✅' : '⚠️ Not configured'));
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'list') {
  loadEnvVars().then(() => listAllBackups());
} else {
  runCompleteBackup();
}

export { runCompleteBackup, listAllBackups }; 