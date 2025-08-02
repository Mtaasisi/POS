#!/usr/bin/env node

/**
 * Simple Local Supabase Backup Script
 * No external dependencies, no API keys needed, just saves to your computer
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabase: {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
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
    // List of all tables in your database
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
 * List available backups
 */
async function listBackups() {
  try {
    const backupDir = path.join(__dirname, config.backup.backupDir);
    const files = await fs.readdir(backupDir);
    
    const backups = [];
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          name: file,
          size: stats.size,
          date: stats.mtime,
          path: filePath
        });
      }
    }
    
    // Sort by date (newest first)
    backups.sort((a, b) => b.date - a.date);
    
    console.log('📋 Available backups:');
    console.log('='.repeat(80));
    
    for (const backup of backups) {
      const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
      const date = backup.date.toLocaleString();
      console.log(`${backup.name} | ${sizeMB} MB | ${date}`);
    }
    
    console.log('='.repeat(80));
    console.log(`Total: ${backups.length} backups`);
    
    return backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    return [];
  }
}

/**
 * Restore from backup
 */
async function restoreFromBackup(backupFile) {
  try {
    console.log(`🔄 Restoring from backup: ${backupFile}`);
    
    const backupContent = await fs.readFile(backupFile, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    console.log(`📊 Backup contains ${Object.keys(backupData.tables).length} tables`);
    
    // For safety, we'll just show what would be restored
    console.log('📋 Tables in backup:');
    for (const [tableName, tableData] of Object.entries(backupData.tables)) {
      console.log(`  - ${tableName}: ${tableData.rowCount} rows`);
    }
    
    console.log('⚠️  Restore functionality is read-only for safety');
    console.log('💡 To restore, manually copy data from backup files');
    
  } catch (error) {
    console.error('❌ Error reading backup:', error);
  }
}

/**
 * Main backup function
 */
async function runBackup() {
  try {
    console.log('🔄 Starting local Supabase backup...');
    
    await initializeSupabase();
    
    // Create backup
    const backupFile = await createBackup();
    if (!backupFile) {
      console.error('❌ Failed to create backup');
      return;
    }
    
    // Clean old backups
    await cleanOldBackups();
    
    console.log('🎉 Backup completed successfully!');
    console.log(`💾 Backup saved to: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Handle command line arguments
const command = process.argv[2];

if (command === 'list') {
  listBackups();
} else if (command === 'restore' && process.argv[3]) {
  restoreFromBackup(process.argv[3]);
} else {
  runBackup();
}

export { runBackup, listBackups, restoreFromBackup }; 