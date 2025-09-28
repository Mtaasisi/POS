#!/usr/bin/env node

/**
 * Complete Supabase Database Backup Script
 * Exports all tables and data from the Supabase database
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
const backupDir = `backup_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}_${Date.now()}`;
fs.mkdirSync(backupDir, { recursive: true });

console.log(`📁 Created backup directory: ${backupDir}`);

// Function to export table data
async function exportTable(tableName) {
  try {
    console.log(`📊 Exporting table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error(`❌ Error exporting ${tableName}:`, error.message);
      return { table: tableName, error: error.message, count: 0 };
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

// Function to get table schema
async function getTableSchema(tableName) {
  try {
    const { data, error } = await supabase
      .rpc('get_table_schema', { table_name: tableName });
    
    if (error) {
      // Fallback: try to get schema from information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');
      
      if (schemaError) {
        console.warn(`⚠️  Could not get schema for ${tableName}`);
        return null;
      }
      
      return schemaData;
    }
    
    return data;
  } catch (err) {
    console.warn(`⚠️  Could not get schema for ${tableName}:`, err.message);
    return null;
  }
}

// Main backup function
async function backupDatabase() {
  console.log('🚀 Starting complete database backup...');
  console.log(`📅 Backup started at: ${new Date().toISOString()}`);
  console.log(`🔗 Database URL: ${config.url}`);
  
  const results = [];
  const schemas = {};
  
  // Export all tables
  for (const table of ALL_TABLES) {
    const result = await exportTable(table);
    results.push(result);
    
    // Get schema for each table
    const schema = await getTableSchema(table);
    if (schema) {
      schemas[table] = schema;
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save schemas
  const schemaFile = path.join(backupDir, 'table_schemas.json');
  fs.writeFileSync(schemaFile, JSON.stringify(schemas, null, 2));
  console.log(`📋 Saved table schemas to: ${schemaFile}`);
  
  // Generate SQL dump
  await generateSQLDump(results, backupDir);
  
  // Generate summary report
  generateSummaryReport(results, backupDir);
  
  console.log('🎉 Database backup completed successfully!');
  console.log(`📁 Backup location: ${path.resolve(backupDir)}`);
}

// Function to generate SQL dump
async function generateSQLDump(results, backupDir) {
  console.log('📝 Generating SQL dump...');
  
  let sqlContent = `-- Complete Database Backup
-- Generated on: ${new Date().toISOString()}
-- Database URL: ${config.url}

-- Disable foreign key checks
SET session_replication_role = replica;

`;

  // Generate INSERT statements for each table
  for (const result of results) {
    if (result.error || result.count === 0) {
      sqlContent += `-- Table: ${result.table} (${result.error ? 'ERROR: ' + result.error : 'EMPTY'})
-- No data to export

`;
      continue;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(result.file, 'utf8'));
      
      if (data.length === 0) {
        sqlContent += `-- Table: ${result.table} (EMPTY)
-- No data to export

`;
        continue;
      }
      
      sqlContent += `-- Table: ${result.table} (${data.length} records)
`;
      
      // Get column names from first record
      const columns = Object.keys(data[0]);
      const columnList = columns.join(', ');
      
      // Generate INSERT statements
      for (const record of data) {
        const values = columns.map(col => {
          const value = record[col];
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
          return value;
        }).join(', ');
        
        sqlContent += `INSERT INTO ${result.table} (${columnList}) VALUES (${values});

`;
      }
      
      sqlContent += `
`;
      
    } catch (err) {
      console.error(`❌ Error generating SQL for ${result.table}:`, err.message);
      sqlContent += `-- ERROR generating SQL for ${result.table}: ${err.message}

`;
    }
  }
  
  sqlContent += `-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Backup completed
`;

  const sqlFile = path.join(backupDir, 'complete_database_dump.sql');
  fs.writeFileSync(sqlFile, sqlContent);
  console.log(`💾 SQL dump saved to: ${sqlFile}`);
}

// Function to generate summary report
function generateSummaryReport(results, backupDir) {
  console.log('📊 Generating summary report...');
  
  const totalTables = results.length;
  const successfulExports = results.filter(r => !r.error).length;
  const failedExports = results.filter(r => r.error).length;
  const totalRecords = results.reduce((sum, r) => sum + (r.count || 0), 0);
  
  const report = {
    backup_info: {
      timestamp: new Date().toISOString(),
      database_url: config.url,
      backup_directory: backupDir,
      total_tables: totalTables,
      successful_exports: successfulExports,
      failed_exports: failedExports,
      total_records: totalRecords
    },
    table_summary: results.map(r => ({
      table: r.table,
      record_count: r.count || 0,
      status: r.error ? 'FAILED' : 'SUCCESS',
      error: r.error || null,
      file: r.file || null
    })),
    failed_tables: results.filter(r => r.error).map(r => ({
      table: r.table,
      error: r.error
    })),
    successful_tables: results.filter(r => !r.error).map(r => ({
      table: r.table,
      record_count: r.count
    }))
  };
  
  const reportFile = path.join(backupDir, 'backup_summary.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // Generate human-readable report
  const humanReport = `# Database Backup Summary

**Backup Information:**
- Date: ${new Date().toISOString()}
- Database: ${config.url}
- Total Tables: ${totalTables}
- Successful Exports: ${successfulExports}
- Failed Exports: ${failedExports}
- Total Records: ${totalRecords}

## Table Details

${results.map(r => 
  `### ${r.table}
- Records: ${r.count || 0}
- Status: ${r.error ? '❌ FAILED' : '✅ SUCCESS'}
${r.error ? `- Error: ${r.error}` : ''}
${r.file ? `- File: ${path.basename(r.file)}` : ''}
`).join('\n')}

## Failed Tables

${failedExports > 0 ? 
  results.filter(r => r.error).map(r => `- ${r.table}: ${r.error}`).join('\n') : 
  'No failed exports'
}

## Files Generated

- \`complete_database_dump.sql\` - Complete SQL dump
- \`table_schemas.json\` - Table schemas
- \`backup_summary.json\` - This summary in JSON format
- \`*.json\` - Individual table data files

## Restoration Instructions

To restore this backup:

1. **Using SQL Dump:**
   \`\`\`bash
   psql -h your-host -U your-user -d your-database -f complete_database_dump.sql
   \`\`\`

2. **Using Individual JSON Files:**
   Import each JSON file using your preferred method (Supabase dashboard, custom script, etc.)

3. **Verify Restoration:**
   Check the backup_summary.json for expected record counts and compare with restored data.

---
*Backup completed successfully at ${new Date().toISOString()}*
`;

  const humanReportFile = path.join(backupDir, 'BACKUP_README.md');
  fs.writeFileSync(humanReportFile, humanReport);
  
  console.log(`📋 Summary report saved to: ${reportFile}`);
  console.log(`📖 Human-readable report saved to: ${humanReportFile}`);
  
  // Print summary to console
  console.log('\n📊 BACKUP SUMMARY:');
  console.log(`✅ Successful exports: ${successfulExports}/${totalTables}`);
  console.log(`❌ Failed exports: ${failedExports}/${totalTables}`);
  console.log(`📦 Total records: ${totalRecords}`);
  
  if (failedExports > 0) {
    console.log('\n❌ Failed tables:');
    results.filter(r => r.error).forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }
}

// Run the backup
backupDatabase().catch(console.error);
