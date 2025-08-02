#!/usr/bin/env node

/**
 * Automatic Supabase to Hostinger Backup Script
 * This script creates daily backups of all Supabase data and uploads to Hostinger storage
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backup.env file
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

// Configuration
let config = {
  supabase: {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    anonKey: null,
    serviceRoleKey: null,
  },
  hostinger: {
    apiUrl: 'https://api.hostinger.com/v1',
    apiToken: null,
    storagePath: '/backups/supabase',
  },
  backup: {
    retentionDays: 30,
    maxFileSize: 100,
    compressBackups: true,
  }
};

// Initialize configuration with environment variables
async function initializeConfig() {
  const envVars = await loadEnvVars();
  
  config = {
    supabase: {
      url: envVars.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co',
      anonKey: envVars.VITE_SUPABASE_ANON_KEY,
      serviceRoleKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
    },
    hostinger: {
      apiUrl: envVars.HOSTINGER_API_URL || 'https://api.hostinger.com/v1',
      apiToken: envVars.HOSTINGER_API_TOKEN,
      storagePath: envVars.HOSTINGER_STORAGE_PATH || '/backups/supabase',
    },
    backup: {
      retentionDays: parseInt(envVars.BACKUP_RETENTION_DAYS) || 30,
      maxFileSize: parseInt(envVars.MAX_BACKUP_SIZE_MB) || 100,
      compressBackups: envVars.COMPRESS_BACKUPS !== 'false',
    }
  };
}

// Initialize Supabase client
let supabase;

async function initializeSupabase() {
  await initializeConfig();
  supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey);
}

/**
 * Get all tables from Supabase
 */
async function getAllTables() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%');

    if (error) {
      console.error('Error fetching tables:', error);
      return [];
    }

    return data?.map(table => table.table_name) || [];
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
}

/**
 * Export table data as JSON
 */
async function exportTableData(tableName) {
  try {
    console.log(`📊 Exporting table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      return { tableName, data: [], error: error.message };
    }

    return { tableName, data: data || [], error: null };
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
    return { tableName, data: [], error: error.message };
  }
}

/**
 * Create backup directory structure
 */
async function createBackupDirectories() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups', timestamp);
  const logsDir = path.join(__dirname, 'backups', 'logs');
  
  await fs.mkdir(backupDir, { recursive: true });
  await fs.mkdir(logsDir, { recursive: true });
  
  return { backupDir, logsDir, timestamp };
}

/**
 * Generate backup summary
 */
function generateBackupSummary(tablesData, timestamp) {
  const summary = {
    timestamp,
    totalTables: tablesData.length,
    tablesWithData: 0,
    totalRecords: 0,
    tableDetails: {},
    errors: []
  };

  tablesData.forEach(table => {
    if (table.error) {
      summary.errors.push({ table: table.tableName, error: table.error });
    } else {
      const recordCount = table.data.length;
      summary.totalRecords += recordCount;
      summary.tableDetails[table.tableName] = recordCount;
      
      if (recordCount > 0) {
        summary.tablesWithData++;
      }
    }
  });

  return summary;
}

/**
 * Upload file to Hostinger storage
 */
async function uploadToHostinger(filePath, remotePath) {
  try {
    if (!config.hostinger.apiToken) {
      console.log('⚠️  Hostinger API token not configured, skipping upload');
      return { success: false, error: 'API token not configured' };
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('path', remotePath);

    const response = await fetch(`${config.hostinger.apiUrl}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.hostinger.apiToken}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Uploaded to Hostinger: ${remotePath}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Upload to Hostinger failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    const backupsDir = path.join(__dirname, 'backups');
    const entries = await fs.readdir(backupsDir, { withFileTypes: true });
    
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - (config.backup.retentionDays * 24 * 60 * 60 * 1000));
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'logs') {
        const backupDate = new Date(entry.name.replace(/-/g, ':'));
        if (backupDate < cutoffDate) {
          const backupPath = path.join(backupsDir, entry.name);
          await fs.rm(backupPath, { recursive: true, force: true });
          console.log(`🗑️  Deleted old backup: ${entry.name}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

/**
 * Main backup function
 */
async function performBackup() {
  const startTime = Date.now();
  console.log('🚀 Starting Supabase backup...');
  
  try {
    await initializeSupabase();
    // Create backup directories
    const { backupDir, logsDir, timestamp } = await createBackupDirectories();
    
    // Get all tables
    console.log('📋 Getting table list...');
    const tables = await getAllTables();
    console.log(`Found ${tables.length} tables`);
    
    // Export all table data
    console.log('📊 Exporting table data...');
    const tablesData = [];
    for (const table of tables) {
      const tableData = await exportTableData(table);
      tablesData.push(tableData);
      
      // Save individual table backup
      const tableBackupPath = path.join(backupDir, `${table}.json`);
      await fs.writeFile(tableBackupPath, JSON.stringify(tableData, null, 2));
    }
    
    // Generate backup summary
    const summary = generateBackupSummary(tablesData, timestamp);
    const summaryPath = path.join(backupDir, 'backup_summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Create complete backup file
    const completeBackupPath = path.join(backupDir, 'complete_backup.json');
    const completeBackup = {
      metadata: summary,
      data: tablesData
    };
    await fs.writeFile(completeBackupPath, JSON.stringify(completeBackup, null, 2));
    
    // Upload to Hostinger
    console.log('☁️  Uploading to Hostinger...');
    const remotePath = `${config.hostinger.storagePath}/${timestamp}`;
    
    // Upload complete backup
    await uploadToHostinger(completeBackupPath, `${remotePath}/complete_backup.json`);
    
    // Upload summary
    await uploadToHostinger(summaryPath, `${remotePath}/backup_summary.json`);
    
    // Upload individual table backups
    for (const table of tables) {
      const tableBackupPath = path.join(backupDir, `${table}.json`);
      await uploadToHostinger(tableBackupPath, `${remotePath}/tables/${table}.json`);
    }
    
    // Clean old backups
    console.log('🧹 Cleaning old backups...');
    await cleanOldBackups();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Backup completed successfully in ${duration}s`);
    console.log(`📊 Summary: ${summary.totalTables} tables, ${summary.totalRecords} records`);
    console.log(`📁 Backup saved to: ${backupDir}`);
    
    // Log backup completion
    const logEntry = {
      timestamp,
      duration: parseFloat(duration),
      success: true,
      summary,
      errors: summary.errors
    };
    
    const logPath = path.join(logsDir, 'backup_log.json');
    const existingLogs = await fs.readFile(logPath, 'utf-8').catch(() => '[]');
    const logs = JSON.parse(existingLogs);
    logs.push(logEntry);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    
    return { success: true, summary, backupDir };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    
    // Log error
    const logEntry = {
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message,
      stack: error.stack
    };
    
    const logsDir = path.join(__dirname, 'backups', 'logs');
    const logPath = path.join(logsDir, 'backup_log.json');
    const existingLogs = await fs.readFile(logPath, 'utf-8').catch(() => '[]');
    const logs = JSON.parse(existingLogs);
    logs.push(logEntry);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    
    return { success: false, error: error.message };
  }
}

/**
 * Test backup functionality
 */
async function testBackup() {
  console.log('🧪 Testing backup functionality...');
  
  try {
    await initializeSupabase();
    
    // Test configuration
    console.log('📋 Configuration:');
    console.log(`  Supabase URL: ${config.supabase.url}`);
    console.log(`  Hostinger API: ${config.hostinger.apiUrl}`);
    console.log(`  Retention days: ${config.backup.retentionDays}`);
    
    // Test Supabase connection
    try {
      const tables = await getAllTables();
      console.log(`✅ Supabase connection: OK (${tables.length} tables found)`);
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
    }
    
    // Test Hostinger connection
    if (config.hostinger.apiToken) {
      try {
        const response = await fetch(`${config.hostinger.apiUrl}/domains`, {
          headers: {
            'Authorization': `Bearer ${config.hostinger.apiToken}`
          }
        });
        
        if (response.ok) {
          console.log('✅ Hostinger API connection: OK');
        } else {
          console.log('❌ Hostinger API connection failed');
        }
      } catch (error) {
        console.error('❌ Hostinger API connection failed:', error);
      }
    } else {
      console.log('⚠️  Hostinger API token not configured');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  switch (command) {
    case 'backup':
      performBackup();
      break;
    case 'test':
      testBackup();
      break;
    default:
      console.log('Usage: node backup-supabase-to-hostinger.mjs [backup|test]');
      console.log('');
      console.log('Commands:');
      console.log('  backup  - Perform full backup to Hostinger');
      console.log('  test    - Test configuration and connections');
      console.log('');
      console.log('Environment variables:');
      console.log('  VITE_SUPABASE_URL - Supabase project URL');
      console.log('  VITE_SUPABASE_ANON_KEY - Supabase anonymous key');
      console.log('  SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (recommended)');
      console.log('  HOSTINGER_API_TOKEN - Hostinger API token');
      console.log('  HOSTINGER_STORAGE_PATH - Storage path on Hostinger');
      console.log('  BACKUP_RETENTION_DAYS - Days to keep backups (default: 30)');
  }
} 