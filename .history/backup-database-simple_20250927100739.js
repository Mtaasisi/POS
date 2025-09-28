#!/usr/bin/env node

/**
 * Simple Supabase Database Backup Script
 * Uses direct SQL commands to export all data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    return { url: envUrl, key: envKey };
  }
  
  // Fallback to local development configuration
  console.log('🏠 Using local Supabase configuration (fallback)');
  return {
    url: 'http://127.0.0.1:54321',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  };
};

const config = getConfig();
const supabase = createClient(config.url, config.key);

// All tables from database.types.ts
const ALL_TABLES = [
  'auth_users',
  'customers',
  'devices',
  'device_price_history',
  'device_checklists',
  'device_attachments',
  'device_remarks',
  'device_transitions',
  'device_ratings',
  'customer_notes',
  'promo_messages',
  'customer_payments',
  'finance_accounts',
  'sms_campaigns',
  'sms_triggers',
  'sms_trigger_logs',
  'sms_templates',
  'sms_logs',
  'communication_templates',
  'diagnostic_requests',
  'diagnostic_devices',
  'diagnostic_checks',
  'diagnostic_templates',
  'diagnostic-images',
  'returns',
  'return_remarks',
  'audit_logs',
  'points_transactions',
  'redemption_rewards',
  'redemption_transactions',
  'spare_parts',
  'spare_parts_usage',
  'inventory_categories',
  'inventory_products',
  'inventory_transactions',
  'lats_sales',
  'lats_sale_items',
  'lats_products',
  'lats_product_variants',
  'lats_receipts',
  'lats_stock_movements'
];

// Create backup directory
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupDir = `database_backup_${timestamp}`;
fs.mkdirSync(backupDir, { recursive: true });

console.log(`📁 Created backup directory: ${backupDir}`);

// Function to export table data using direct SQL
async function exportTableWithSQL(tableName) {
  try {
    console.log(`📊 Exporting table: ${tableName}`);
    
    // Use direct SQL query to get all data
    const { data, error } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT * FROM ${tableName} ORDER BY created_at DESC NULLS LAST, id` 
      });
    
    if (error) {
      // Fallback to regular select
      const { data: fallbackData, error: fallbackError } = await supabase
        .from(tableName)
        .select('*');
      
      if (fallbackError) {
        console.error(`❌ Error exporting ${tableName}:`, fallbackError.message);
        return { table: tableName, error: fallbackError.message, count: 0 };
      }
      
      // Save to JSON file
      const jsonFile = path.join(backupDir, `${tableName}.json`);
      fs.writeFileSync(jsonFile, JSON.stringify(fallbackData, null, 2));
      
      console.log(`✅ Exported ${tableName}: ${fallbackData?.length || 0} records`);
      return { table: tableName, count: fallbackData?.length || 0, file: jsonFile };
    }
    
    // Save to JSON file
    const jsonFile = path.join(backupDir, `${tableName}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
    
    console.log(`✅ Exported ${tableName}: ${data?.length || 0} records`);
    return { table: tableName, count: data?.length || 0, file: jsonFile };
    
  } catch (err) {
    console.error(`❌ Exception exporting ${tableName}:`, err.message);
    return { table: tableName, error: err.message, count: 0 };
  }
}

// Function to get table count
async function getTableCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.warn(`⚠️  Could not get count for ${tableName}:`, error.message);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.warn(`⚠️  Could not get count for ${tableName}:`, err.message);
    return 0;
  }
}

// Main backup function
async function backupDatabase() {
  console.log('🚀 Starting database backup...');
  console.log(`📅 Backup started at: ${new Date().toISOString()}`);
  console.log(`🔗 Database URL: ${config.url}`);
  
  const results = [];
  const tableCounts = {};
  
  // Get counts for all tables first
  console.log('\n📊 Getting table counts...');
  for (const table of ALL_TABLES) {
    const count = await getTableCount(table);
    tableCounts[table] = count;
    console.log(`   ${table}: ${count} records`);
  }
  
  console.log('\n📦 Exporting table data...');
  
  // Export all tables
  for (const table of ALL_TABLES) {
    const result = await exportTableWithSQL(table);
    results.push(result);
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Generate summary
  generateSummary(results, tableCounts, backupDir);
  
  console.log('\n🎉 Database backup completed successfully!');
  console.log(`📁 Backup location: ${path.resolve(backupDir)}`);
}

// Function to generate summary
function generateSummary(results, tableCounts, backupDir) {
  console.log('\n📊 Generating backup summary...');
  
  const totalTables = results.length;
  const successfulExports = results.filter(r => !r.error).length;
  const failedExports = results.filter(r => r.error).length;
  const totalRecords = results.reduce((sum, r) => sum + (r.count || 0), 0);
  
  const summary = {
    backup_info: {
      timestamp: new Date().toISOString(),
      database_url: config.url,
      backup_directory: backupDir,
      total_tables: totalTables,
      successful_exports: successfulExports,
      failed_exports: failedExports,
      total_records: totalRecords
    },
    tables: results.map(r => ({
      name: r.table,
      exported_records: r.count || 0,
      expected_records: tableCounts[r.table] || 0,
      status: r.error ? 'FAILED' : 'SUCCESS',
      error: r.error || null,
      file: r.file ? path.basename(r.file) : null
    }))
  };
  
  // Save JSON summary
  const summaryFile = path.join(backupDir, 'backup_summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  // Generate human-readable report
  const report = `# Database Backup Report

**Backup Information:**
- Date: ${new Date().toISOString()}
- Database: ${config.url}
- Total Tables: ${totalTables}
- Successful Exports: ${successfulExports}
- Failed Exports: ${failedExports}
- Total Records Exported: ${totalRecords}

## Table Export Results

| Table | Status | Exported | Expected | File |
|-------|--------|----------|----------|------|
${results.map(r => 
  `| ${r.table} | ${r.error ? '❌ FAILED' : '✅ SUCCESS'} | ${r.count || 0} | ${tableCounts[r.table] || 0} | ${r.file ? path.basename(r.file) : 'N/A'} |`
).join('\n')}

## Failed Exports

${failedExports > 0 ? 
  results.filter(r => r.error).map(r => `- **${r.table}**: ${r.error}`).join('\n') : 
  '✅ No failed exports'
}

## Files Generated

- \`backup_summary.json\` - Complete backup summary
- \`*.json\` - Individual table data files (${successfulExports} files)

## Next Steps

1. **Verify Backup**: Check that all expected records were exported
2. **Test Restoration**: Import a few tables to verify the backup works
3. **Store Securely**: Move backup to secure location
4. **Schedule Regular Backups**: Set up automated backup schedule

---
*Backup completed at ${new Date().toISOString()}*
`;

  const reportFile = path.join(backupDir, 'BACKUP_REPORT.md');
  fs.writeFileSync(reportFile, report);
  
  console.log(`📋 Summary saved to: ${summaryFile}`);
  console.log(`📖 Report saved to: ${reportFile}`);
  
  // Print final summary
  console.log('\n📊 FINAL SUMMARY:');
  console.log(`✅ Successful: ${successfulExports}/${totalTables} tables`);
  console.log(`❌ Failed: ${failedExports}/${totalTables} tables`);
  console.log(`📦 Total records: ${totalRecords}`);
  
  if (failedExports > 0) {
    console.log('\n❌ Failed tables:');
    results.filter(r => r.error).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }
  
  console.log(`\n📁 All files saved to: ${path.resolve(backupDir)}`);
}

// Run the backup
backupDatabase().catch(console.error);
