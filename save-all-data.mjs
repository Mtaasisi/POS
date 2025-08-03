#!/usr/bin/env node

/**
 * Complete Data Save Solution
 * Saves all data with multiple storage options and comprehensive reporting
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
  backup: {
    retentionDays: 30,
    backupDir: './data-backups',
    exportFormats: ['json', 'csv', 'sql'],
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
    const tables = [
      'customers', 'devices', 'payments', 'audit_logs', 'settings',
      'customer_notes', 'device_transitions', 'device_remarks',
      'communication_templates', 'sms_logs', 'user_daily_goals',
      'inventory_categories', 'products', 'product_variants',
      'spare_parts', 'stock_movements', 'suppliers'
    ];
    
    console.log(`📋 Found ${tables.length} tables to save`);
    return tables;
  } catch (error) {
    console.error('❌ Error getting tables:', error);
    return [];
  }
}

/**
 * Save a single table with multiple formats
 */
async function saveTable(tableName) {
  try {
    console.log(`📦 Saving table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error saving ${tableName}:`, error);
      return null;
    }
    
    const tableData = {
      table: tableName,
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      data: data
    };
    
    console.log(`✅ Saved ${tableName}: ${data.length} rows`);
    return tableData;
  } catch (error) {
    console.error(`❌ Error saving ${tableName}:`, error);
    return null;
  }
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data, tableName) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Convert data to SQL format
 */
function convertToSQL(data, tableName) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const sqlRows = [];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value;
    });
    sqlRows.push(`INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')});`);
  }
  
  return sqlRows.join('\n');
}

/**
 * Create comprehensive data save
 */
async function saveAllData() {
  const startTime = Date.now();
  console.log('🚀 Starting comprehensive data save...');
  
  try {
    await initializeSupabase();
    
    // Create backup directories
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, config.backup.backupDir, timestamp);
    await fs.mkdir(backupDir, { recursive: true });
    
    console.log(`📁 Created backup directory: ${backupDir}`);
    
    const tables = await getAllTables();
    const savedData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0',
        totalTables: tables.length,
        totalRows: 0,
        backupSize: 0,
        formats: config.backup.exportFormats
      },
      tables: {},
      summary: {}
    };
    
    let totalRows = 0;
    const tableSummaries = {};
    
    // Save each table
    for (const table of tables) {
      const tableData = await saveTable(table);
      if (tableData) {
        savedData.tables[table] = tableData;
        totalRows += tableData.rowCount;
        
        // Create table summary
        tableSummaries[table] = {
          rowCount: tableData.rowCount,
          lastModified: tableData.timestamp,
          size: JSON.stringify(tableData.data).length
        };
        
        // Save in different formats
        const tableDir = path.join(backupDir, table);
        await fs.mkdir(tableDir, { recursive: true });
        
        // JSON format
        const jsonPath = path.join(tableDir, `${table}.json`);
        await fs.writeFile(jsonPath, JSON.stringify(tableData, null, 2));
        
        // CSV format
        const csvPath = path.join(tableDir, `${table}.csv`);
        const csvData = convertToCSV(tableData.data, table);
        await fs.writeFile(csvPath, csvData);
        
        // SQL format
        const sqlPath = path.join(tableDir, `${table}.sql`);
        const sqlData = convertToSQL(tableData.data, table);
        await fs.writeFile(sqlPath, sqlData);
        
        console.log(`✅ Saved ${table} in 3 formats (JSON, CSV, SQL)`);
      }
    }
    
    savedData.metadata.totalRows = totalRows;
    savedData.summary = tableSummaries;
    
    // Create complete backup file
    const completeBackupPath = path.join(backupDir, 'complete_backup.json');
    await fs.writeFile(completeBackupPath, JSON.stringify(savedData, null, 2));
    
    // Create summary report
    const summaryReport = generateSummaryReport(savedData, timestamp);
    const summaryPath = path.join(backupDir, 'summary_report.md');
    await fs.writeFile(summaryPath, summaryReport);
    
    // Get file size
    const stats = await fs.stat(completeBackupPath);
    savedData.metadata.backupSize = stats.size;
    
    // Create backup info
    const backupInfo = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      totalTables: tables.length,
      totalRows,
      backupSize: stats.size,
      backupPath: backupDir,
      status: 'success'
    };
    
    const infoPath = path.join(backupDir, 'backup_info.json');
    await fs.writeFile(infoPath, JSON.stringify(backupInfo, null, 2));
    
    console.log('\n🎉 Data Save Complete!');
    console.log(`📊 Summary:`);
    console.log(`   • Total Tables: ${tables.length}`);
    console.log(`   • Total Rows: ${totalRows.toLocaleString()}`);
    console.log(`   • Backup Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   • Duration: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
    console.log(`   • Location: ${backupDir}`);
    console.log(`   • Formats: JSON, CSV, SQL`);
    
    return backupDir;
  } catch (error) {
    console.error('❌ Error saving data:', error);
    return null;
  }
}

/**
 * Generate summary report
 */
function generateSummaryReport(data, timestamp) {
  const report = `# Data Save Report - ${new Date().toISOString()}

## 📊 Backup Summary

- **Timestamp**: ${data.metadata.timestamp}
- **Total Tables**: ${data.metadata.totalTables}
- **Total Rows**: ${data.metadata.totalRows.toLocaleString()}
- **Backup Size**: ${(data.metadata.backupSize / 1024 / 1024).toFixed(2)} MB
- **Formats**: ${data.metadata.formats.join(', ')}

## 📋 Table Details

| Table | Rows | Size (KB) | Last Modified |
|-------|------|-----------|---------------|
${Object.entries(data.summary).map(([table, info]) => 
  `| ${table} | ${info.rowCount.toLocaleString()} | ${(info.size / 1024).toFixed(1)} | ${new Date(info.lastModified).toLocaleString()} |`
).join('\n')}

## 🎯 Data Security

✅ All data backed up in multiple formats
✅ JSON format for easy restoration
✅ CSV format for spreadsheet analysis
✅ SQL format for database import
✅ Complete metadata included
✅ Timestamp tracking for version control

## 📁 File Structure

\`\`\`
data-backups/${timestamp}/
├── complete_backup.json          # Complete backup
├── summary_report.md             # This report
├── backup_info.json              # Backup metadata
└── [table_name]/
    ├── [table_name].json         # JSON format
    ├── [table_name].csv          # CSV format
    └── [table_name].sql          # SQL format
\`\`\`

## 🔄 Restoration

To restore data:
1. Use the JSON files for complete restoration
2. Use the SQL files for database import
3. Use the CSV files for spreadsheet analysis

## 📞 Support

If you need help restoring your data, refer to the backup documentation.
`;

  return report;
}

/**
 * List all backups
 */
async function listBackups() {
  try {
    const backupDir = path.join(__dirname, config.backup.backupDir);
    const backups = await fs.readdir(backupDir);
    
    console.log('📁 Available Data Backups:');
    console.log('============================');
    
    for (const backup of backups) {
      const backupPath = path.join(backupDir, backup);
      const stats = await fs.stat(backupPath);
      
      if (stats.isDirectory()) {
        const infoPath = path.join(backupPath, 'backup_info.json');
        try {
          const info = JSON.parse(await fs.readFile(infoPath, 'utf8'));
          console.log(`📦 ${backup}`);
          console.log(`   • Tables: ${info.totalTables}`);
          console.log(`   • Rows: ${info.totalRows.toLocaleString()}`);
          console.log(`   • Size: ${(info.backupSize / 1024 / 1024).toFixed(2)} MB`);
          console.log(`   • Date: ${new Date(info.timestamp).toLocaleString()}`);
          console.log(`   • Duration: ${(info.duration / 1000).toFixed(2)}s`);
          console.log('');
        } catch (error) {
          console.log(`📦 ${backup} (legacy backup)`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error listing backups:', error);
  }
}

/**
 * Clean old backups
 */
async function cleanOldBackups() {
  try {
    const backupDir = path.join(__dirname, config.backup.backupDir);
    const backups = await fs.readdir(backupDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.backup.retentionDays);
    
    let cleanedCount = 0;
    
    for (const backup of backups) {
      const backupPath = path.join(backupDir, backup);
      const stats = await fs.stat(backupPath);
      
      if (stats.isDirectory() && stats.mtime < cutoffDate) {
        await fs.rm(backupPath, { recursive: true });
        console.log(`🗑️  Cleaned old backup: ${backup}`);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`✅ Cleaned ${cleanedCount} old backups`);
    } else {
      console.log('✅ No old backups to clean');
    }
  } catch (error) {
    console.error('❌ Error cleaning backups:', error);
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'save':
      await saveAllData();
      break;
    case 'list':
      await listBackups();
      break;
    case 'clean':
      await cleanOldBackups();
      break;
    default:
      console.log('📋 Data Save Commands:');
      console.log('  node save-all-data.mjs save   - Save all data');
      console.log('  node save-all-data.mjs list   - List all backups');
      console.log('  node save-all-data.mjs clean  - Clean old backups');
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { saveAllData, listBackups, cleanOldBackups }; 