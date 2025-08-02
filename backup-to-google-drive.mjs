#!/usr/bin/env node

/**
 * Simple Supabase to Google Drive Backup Script
 * Easy setup, no DNS issues, reliable service
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabase: {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  },
  googleDrive: {
    folderId: null, // Will be set during setup
    credentialsPath: './google-credentials.json'
  },
  backup: {
    retentionDays: 30,
    compressBackups: true
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
    // Get list of tables by querying each known table
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
      tables: {}
    };
    
    // Backup each table
    for (const table of tables) {
      const tableBackup = await backupTable(table);
      if (tableBackup) {
        backupData.tables[table] = tableBackup;
      }
    }
    
    // Create backup file
    const backupDir = path.join(__dirname, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    return null;
  }
}

/**
 * Setup Google Drive API
 */
async function setupGoogleDrive() {
  try {
    console.log('🔧 Setting up Google Drive...');
    
    // Check if credentials file exists
    const credentialsPath = path.join(__dirname, config.googleDrive.credentialsPath);
    
    if (!await fs.access(credentialsPath).then(() => true).catch(() => false)) {
      console.log('📝 Google Drive setup required:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create a new project or select existing');
      console.log('3. Enable Google Drive API');
      console.log('4. Create credentials (Service Account)');
      console.log('5. Download JSON credentials file');
      console.log('6. Save as "google-credentials.json" in this directory');
      console.log('7. Share your Google Drive folder with the service account email');
      return false;
    }
    
    const credentials = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });
    
    const drive = google.drive({ version: 'v3', auth });
    
    // Create backup folder if it doesn't exist
    if (!config.googleDrive.folderId) {
      const folderMetadata = {
        name: 'Supabase Backups',
        mimeType: 'application/vnd.google-apps.folder'
      };
      
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });
      
      config.googleDrive.folderId = folder.data.id;
      console.log(`✅ Created backup folder: ${config.googleDrive.folderId}`);
    }
    
    return drive;
  } catch (error) {
    console.error('❌ Error setting up Google Drive:', error);
    return null;
  }
}

/**
 * Upload backup to Google Drive
 */
async function uploadToGoogleDrive(backupFile) {
  try {
    console.log('☁️ Uploading to Google Drive...');
    
    const drive = await setupGoogleDrive();
    if (!drive) {
      console.log('⚠️ Google Drive not configured, saving locally only');
      return false;
    }
    
    const fileName = path.basename(backupFile);
    const fileMetadata = {
      name: fileName,
      parents: [config.googleDrive.folderId]
    };
    
    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(backupFile)
    };
    
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    
    console.log(`✅ Uploaded to Google Drive: ${file.data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error);
    return false;
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    console.log('🧹 Cleaning old backups...');
    
    const backupDir = path.join(__dirname, 'backups');
    const files = await fs.readdir(backupDir);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.backup.retentionDays);
    
    let deletedCount = 0;
    for (const file of files) {
      if (file.startsWith('backup-') && file.endsWith('.json')) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} old backup files`);
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error);
  }
}

/**
 * Main backup function
 */
async function runBackup() {
  try {
    console.log('🔄 Starting Supabase to Google Drive backup...');
    
    await initializeSupabase();
    
    // Create backup
    const backupFile = await createBackup();
    if (!backupFile) {
      console.error('❌ Failed to create backup');
      return;
    }
    
    // Upload to Google Drive
    await uploadToGoogleDrive(backupFile);
    
    // Clean old backups
    await cleanOldBackups();
    
    console.log('🎉 Backup completed successfully!');
  } catch (error) {
    console.error('❌ Backup failed:', error);
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup();
}

export { runBackup, setupGoogleDrive }; 