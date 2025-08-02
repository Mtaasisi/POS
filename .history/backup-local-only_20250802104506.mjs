#!/usr/bin/env node

// Local-Only Backup Script (No Hostinger API Required)
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: './backup.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Local-Only Backup System');
console.log('📋 This script creates local backups without requiring Hostinger API');

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration
const config = {
  backup: {
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
    maxSizeMB: parseInt(process.env.MAX_BACKUP_SIZE_MB) || 100,
    compress: process.env.COMPRESS_BACKUPS === 'true'
  }
};

/**
 * Get all tables from Supabase
 */
async function getAllTables() {
  try {
    // List of tables to backup (based on your current setup)
    const tables = [
      'customers',
      'devices', 
      'device_transitions',
      'device_remarks',
      'customer_payments',
      'audit_logs',
      'spare_parts',
      'customer_notes',
      'sms_logs',
      'inventory_categories',
      'suppliers',
      'products',
      'product_variants',
      'stock_movements',
      'user_daily_goals',
      'communication_templates'
    ];
    
    console.log(`📋 Found ${tables.length} tables to backup`);
    return tables;
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
}

/**
 * Export data from a single table
 */
async function exportTableData(tableName) {
  try {
    console.log(`📊 Exporting ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`❌ Error exporting ${tableName}: ${error.message}`);
      return {
        table: tableName,
        data: [],
        error: error.message,
        recordCount: 0
      };
    }
    
    const recordCount = data?.length || 0;
    console.log(`✅ Exported ${tableName}: ${recordCount} records`);
    
    return {
      table: tableName,
      data: data || [],
      error: null,
      recordCount
    };
  } catch (error) {
    console.log(`❌ Exception exporting ${tableName}: ${error.message}`);
    return {
      table: tableName,
      data: [],
      error: error.message,
      recordCount: 0
    };
  }
}

/**
 * Create backup directories
 */
async function createBackupDirectories() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join('./backups', timestamp);
  const logsDir = path.join('./backups', 'logs');
  
  // Create directories if they don't exist
  await fs.promises.mkdir(backupDir, { recursive: true });
  await fs.promises.mkdir(logsDir, { recursive: true });
  
  return { backupDir, logsDir, timestamp };
}

/**
 * Generate backup summary
 */
function generateBackupSummary(tablesData, timestamp) {
  const totalRecords = tablesData.reduce((sum, table) => sum + table.recordCount, 0);
  const tablesWithData = tablesData.filter(table => table.recordCount > 0).length;
  const errors = tablesData.filter(table => table.error).length;
  
  return {
    timestamp,
    totalTables: tablesData.length,
    totalRecords,
    tablesWithData,
    errors,
    backupType: 'local-only',
    hostingerStatus: 'unavailable'
  };
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    const backupsDir = './backups';
    const retentionDays = config.backup.retentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const backupFolders = await fs.promises.readdir(backupsDir);
    let deletedCount = 0;
    
    for (const folder of backupFolders) {
      if (folder === 'logs') continue; // Skip logs directory
      
      const folderPath = path.join(backupsDir, folder);
      const stats = await fs.promises.stat(folderPath);
      
      if (stats.isDirectory() && stats.mtime < cutoffDate) {
        await fs.promises.rm(folderPath, { recursive: true, force: true });
        console.log(`🗑️  Deleted old backup: ${folder}`);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned ${deletedCount} old backups`);
    }
  } catch (error) {
    console.log('Error cleaning old backups:', error);
  }
}

/**
 * Main backup function
 */
async function performBackup() {
  const startTime = Date.now();
  console.log('🚀 Starting local backup...');
  
  try {
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
      await fs.promises.writeFile(tableBackupPath, JSON.stringify(tableData, null, 2));
    }
    
    // Generate backup summary
    const summary = generateBackupSummary(tablesData, timestamp);
    const summaryPath = path.join(backupDir, 'backup_summary.json');
    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    // Create complete backup file
    const completeBackupPath = path.join(backupDir, 'complete_backup.json');
    const completeBackup = {
      metadata: summary,
      data: tablesData
    };
    await fs.promises.writeFile(completeBackupPath, JSON.stringify(completeBackup, null, 2));
    
    // Create backup log
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'backup',
      status: 'success',
      summary,
      duration: Date.now() - startTime,
      hostingerStatus: 'unavailable'
    };
    
    const logPath = path.join(logsDir, `backup-${timestamp}.json`);
    await fs.promises.writeFile(logPath, JSON.stringify(logEntry, null, 2));
    
    // Clean old backups
    await cleanOldBackups();
    
    const duration = (Date.now() - startTime) / 1000;
    
    console.log('\n🎉 Backup completed successfully!');
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total records: ${summary.totalRecords}`);
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`⚠️  Hostinger API: Unavailable (DNS Error 1016)`);
    console.log(`💡 Local backup only - files saved to ./backups/`);
    
    return {
      success: true,
      duration,
      summary,
      backupPath: backupDir
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  performBackup().catch(console.error);
}

export { performBackup }; 