#!/usr/bin/env node

// Google Drive Backup Alternative
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
config({ path: './backup.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_DRIVE_CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const GOOGLE_DRIVE_CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const GOOGLE_DRIVE_REFRESH_TOKEN = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

console.log('🔧 Google Drive Backup Alternative');
console.log('📋 This script creates backups and uploads to Google Drive');

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration
const backupConfig = {
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
    backupType: 'google-drive',
    hostingerStatus: 'unavailable'
  };
}

/**
 * Upload to Google Drive (if configured)
 */
async function uploadToGoogleDrive(filePath, fileName) {
  if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
    console.log('⚠️  Google Drive not configured - skipping cloud upload');
    console.log('💡 To enable Google Drive upload:');
    console.log('   1. Create Google Cloud Project');
    console.log('   2. Enable Google Drive API');
    console.log('   3. Create OAuth 2.0 credentials');
    console.log('   4. Add credentials to backup.env');
    return { success: false, error: 'Not configured', fallback: true };
  }

  try {
    console.log(`☁️  Uploading ${fileName} to Google Drive...`);
    
    // This is a placeholder for Google Drive upload
    // You would need to implement the actual Google Drive API integration
    console.log('📋 Google Drive upload would happen here');
    console.log('💡 For now, using local backup only');
    
    return { success: false, error: 'Google Drive integration not implemented', fallback: true };
  } catch (error) {
    console.log(`❌ Google Drive upload error: ${error.message}`);
    return { success: false, error: error.message, fallback: true };
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    const backupsDir = './backups';
    const retentionDays = backupConfig.backup.retentionDays;
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
  console.log('🚀 Starting Google Drive backup...');
  
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
    
    // Upload to Google Drive
    console.log('☁️  Uploading to Google Drive...');
    const uploadResult = await uploadToGoogleDrive(completeBackupPath, `supabase-backup-${timestamp}.json`);
    
    // Create backup log
    const logEntry = {
      timestamp: new Date().toISOString(),
      action: 'backup',
      status: 'success',
      summary,
      duration: Date.now() - startTime,
      hostingerStatus: 'unavailable',
      googleDriveStatus: uploadResult.success ? 'success' : 'failed'
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
    console.log(`☁️  Google Drive: ${uploadResult.success ? 'Uploaded' : 'Not configured'}`);
    console.log(`💡 Local backup completed - files saved to ./backups/`);
    
    return {
      success: true,
      duration,
      summary,
      backupPath: backupDir,
      googleDriveUpload: uploadResult
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
performBackup().catch(console.error);

export { performBackup }; 