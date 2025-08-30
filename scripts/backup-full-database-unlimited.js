import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// List of ALL tables in your database (both essential and useless)
const ALL_TABLES = [
  // Core Business Tables
  'lats_categories',
  'lats_brands',
  'lats_suppliers',
  'lats_products',
  'lats_product_variants',
  'lats_sales',
  'lats_sale_items',
  'customers',
  'employees',
  'appointments',
  'settings',
  
  // WhatsApp Tables
  'whatsapp_instances_comprehensive',
  'whatsapp_connection_settings',
  'whatsapp_qr_codes',
  'whatsapp_messages',
  'whatsapp_message_templates',
  'whatsapp_hub_settings',
  'whatsapp_instances',
  'whatsapp_automation_workflows',
  'whatsapp_automation_executions',
  'whatsapp_analytics_events',
  'whatsapp_campaigns',
  'whatsapp_bulk_message_results',
  'whatsapp_escalations',
  'whatsapp_contact_preferences',
  'whatsapp_webhooks',
  'whatsapp_authorization_codes',
  'whatsapp_business_message_templates',
  'whatsapp_business_templates',
  'whatsapp_instance_settings_view',
  'whatsapp_integration_settings',
  'whatsapp_logs',
  'whatsapp_templates',
  
  // Green API Tables
  'green_api_message_queue',
  'green_api_message_templates',
  'green_api_bulk_campaigns',
  'green_api_bulk_campaign_results',
  'green_api_webhook_events',
  'green_api_settings',
  
  // POS Settings Tables
  'lats_pos_general_settings',
  'lats_pos_dynamic_pricing_settings',
  'lats_pos_receipt_settings',
  'lats_pos_barcode_scanner_settings',
  'lats_pos_search_filter_settings',
  'lats_pos_user_permissions_settings',
  'lats_pos_loyalty_customer_settings',
  'lats_pos_analytics_reporting_settings',
  'lats_pos_notification_settings',
  'lats_pos_advanced_settings',
  
  // Other Tables
  'scheduled_sms',
  'product_images',
  'user_settings',
  'customer_notes',
  'device_remarks',
  'device_transitions',
  'device_ratings',
  'devices',
  'auth_users',
  'integrations',
  'tax_rates',
  'system_settings',
  'notifications',
  'notification_settings',
  'notification_actions',
  'notification_templates',
  'chat_messages',
  'payment_transactions',
  'payment_webhooks',
  'payment_analytics',
  'lats_storage_rooms',
  'lats_store_shelves',
  'lats_store_locations',
  'lats_purchase_orders',
  'lats_purchase_order_items',
  'lats_spare_parts',
  'lats_spare_part_usage',
  'lats_cart',
  'lats_cart_items',
  'lats_pos_settings',
  'audit_logs',
  
  // Debug/Log Tables
  'uuid_diagnostic_log',
  'inventory_whatsapp_events',
  'product_inquiry_history',
  'inventory_alerts',
  
  // Redundant Settings Tables
  'settings_backups',
  'settings_history',
  'settings_schema',
  
  // Unused Feature Tables
  'redemption_rewards',
  'redemption_transactions',
  'return_items',
  'return_remarks',
  'returns',
  'returns_refunds',
  'scheduled_whatsapp_messages',
  
  // Other Unused Tables
  'quick_reply_categories',
  'quick_replies',
  'sms_logs',
  'sms_trigger_logs',
  'sms_triggers',
  'spare_part_categories',
  'staff_points',
  'stock_movements',
  'user_daily_goals',
  'user_goals'
];

async function getAllRecordsFromTableUnlimited(tableName) {
  const allRecords = [];
  let from = 0;
  const pageSize = 10000; // Increased page size for efficiency
  let retryCount = 0;
  const maxRetries = 3;
  
  console.log(`   🔄 Starting unlimited backup for '${tableName}'...`);
  
  while (true) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, from + pageSize - 1);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`   ✅ Completed '${tableName}' - No more records found`);
        break; // No more records
      }

      allRecords.push(...data);
      
      console.log(`   📥 Fetched ${data.length} records from '${tableName}' (offset: ${from})`);
      
      if (data.length < pageSize) {
        console.log(`   ✅ Completed '${tableName}' - Last page reached`);
        break; // Last page
      }
      
      from += pageSize;
      retryCount = 0; // Reset retry count on successful fetch
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      retryCount++;
      console.log(`   ⚠️  Error fetching '${tableName}' (attempt ${retryCount}/${maxRetries}): ${error.message}`);
      
      if (retryCount >= maxRetries) {
        console.log(`   ❌ Failed to fetch '${tableName}' after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait longer before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
  
  console.log(`   🎉 Successfully backed up ${allRecords.length.toLocaleString()} records from '${tableName}'`);
  return allRecords;
}

async function backupFullDatabaseUnlimited() {
  console.log('💾 Creating UNLIMITED Database Backup - ALL Tables and ALL Data (No Limits)\n');
  
  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `full-database-backup-unlimited-${timestamp}.json`);
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    databaseInfo: {
      url: supabaseUrl,
      totalTables: ALL_TABLES.length,
      backupType: 'UNLIMITED - ALL RECORDS'
    },
    tables: {},
    summary: {
      totalTables: 0,
      tablesWithData: 0,
      totalRecords: 0,
      backupSize: 0,
      backupDuration: 0
    }
  };

  let totalRecords = 0;
  let tablesWithData = 0;
  let processedTables = 0;
  const startTime = Date.now();

  console.log(`📋 Starting UNLIMITED backup of ${ALL_TABLES.length} tables...\n`);
  console.log('🚀 This backup will capture EVERY SINGLE RECORD with no limits!\n');

  for (const tableName of ALL_TABLES) {
    try {
      processedTables++;
      console.log(`\n[${processedTables}/${ALL_TABLES.length}] 📋 Backing up table: ${tableName}`);
      
      // Get ALL data from the table using unlimited pagination
      const data = await getAllRecordsFromTableUnlimited(tableName);
      const recordCount = data.length;
      
      backup.tables[tableName] = {
        exists: true,
        recordCount,
        data: data,
        backupTime: new Date().toISOString()
      };
      
      totalRecords += recordCount;
      if (recordCount > 0) tablesWithData++;

      // Progress update
      const progress = ((processedTables / ALL_TABLES.length) * 100).toFixed(1);
      console.log(`   📊 Progress: ${progress}% (${processedTables}/${ALL_TABLES.length} tables)`);
      console.log(`   📈 Running total: ${totalRecords.toLocaleString()} records backed up`);

    } catch (error) {
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        console.log(`   ⚠️  Table '${tableName}' does not exist, skipping...`);
        backup.tables[tableName] = { 
          exists: false, 
          data: null, 
          error: 'Table not found',
          backupTime: new Date().toISOString()
        };
      } else {
        console.log(`   ❌ Error backing up '${tableName}': ${error.message}`);
        backup.tables[tableName] = { 
          exists: true, 
          error: error.message, 
          data: null,
          backupTime: new Date().toISOString()
        };
      }
    }
  }

  const endTime = Date.now();
  const backupDuration = endTime - startTime;

  // Update summary
  backup.summary.totalTables = ALL_TABLES.length;
  backup.summary.tablesWithData = tablesWithData;
  backup.summary.totalRecords = totalRecords;
  backup.summary.backupDuration = backupDuration;

  // Write backup to file
  try {
    console.log('\n💾 Writing backup to file...');
    const backupJson = JSON.stringify(backup, null, 2);
    fs.writeFileSync(backupFile, backupJson);
    
    // Get file size
    const stats = fs.statSync(backupFile);
    backup.summary.backupSize = stats.size;
    
    console.log(`💾 UNLIMITED backup saved to: ${backupFile}`);
    console.log(`📊 Backup file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error(`❌ Error saving backup: ${error.message}`);
    return;
  }

  // Summary
  console.log('\n🎉 UNLIMITED Database Backup Summary:');
  console.log(`   📋 Total tables processed: ${backup.summary.totalTables}`);
  console.log(`   📦 Tables with data: ${backup.summary.tablesWithData}`);
  console.log(`   📊 Total records backed up: ${backup.summary.totalRecords.toLocaleString()}`);
  console.log(`   💾 Backup file size: ${(backup.summary.backupSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   ⏱️  Backup duration: ${(backupDuration / 1000).toFixed(1)} seconds`);
  
  // Show tables with most data
  const tablesWithDataList = Object.entries(backup.tables)
    .filter(([name, info]) => info.exists && info.recordCount > 0)
    .sort(([,a], [,b]) => b.recordCount - a.recordCount)
    .slice(0, 10);

  if (tablesWithDataList.length > 0) {
    console.log('\n📈 Top 10 Tables by Record Count:');
    tablesWithDataList.forEach(([tableName, info], index) => {
      console.log(`   ${index + 1}. ${tableName}: ${info.recordCount.toLocaleString()} records`);
    });
  }

  console.log('\n🔒 UNLIMITED database backup completed successfully!');
  console.log('🚀 You now have a complete backup of your entire database with ALL records - NO LIMITS!');
  console.log('💡 This backup can be used to restore your database if needed.');

  return backup;
}

// Run the unlimited backup
backupFullDatabaseUnlimited().catch(console.error);
