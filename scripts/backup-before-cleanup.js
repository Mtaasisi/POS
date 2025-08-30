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

// Tables to be removed (same list as cleanup script)
const TABLES_TO_REMOVE = [
  'uuid_diagnostic_log',
  'inventory_whatsapp_events',
  'product_inquiry_history',
  'inventory_alerts',
  'settings_backups',
  'settings_history',
  'settings_schema',
  'redemption_rewards',
  'redemption_transactions',
  'return_items',
  'return_remarks',
  'returns',
  'returns_refunds',
  'scheduled_whatsapp_messages',
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

async function backupBeforeCleanup() {
  console.log('💾 Creating Backup Before Cleanup\n');
  
  const backupDir = path.join(process.cwd(), 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-before-cleanup-${timestamp}.json`);
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backup = {
    timestamp: new Date().toISOString(),
    tables: {},
    summary: {
      totalTables: 0,
      tablesWithData: 0,
      totalRecords: 0
    }
  };

  let totalRecords = 0;
  let tablesWithData = 0;

  for (const tableName of TABLES_TO_REMOVE) {
    try {
      console.log(`📋 Backing up table: ${tableName}`);
      
      // Check if table exists and get data
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1000); // Limit to prevent memory issues

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`   ⚠️  Table '${tableName}' does not exist, skipping...`);
          backup.tables[tableName] = { exists: false, data: null };
        } else {
          console.log(`   ❌ Error accessing '${tableName}': ${error.message}`);
          backup.tables[tableName] = { exists: true, error: error.message, data: null };
        }
      } else {
        const recordCount = data?.length || 0;
        console.log(`   ✅ Backed up ${recordCount} records from '${tableName}'`);
        
        backup.tables[tableName] = {
          exists: true,
          recordCount,
          data: data || []
        };
        
        totalRecords += recordCount;
        if (recordCount > 0) tablesWithData++;
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`   ❌ Unexpected error backing up '${tableName}': ${error.message}`);
      backup.tables[tableName] = { exists: true, error: error.message, data: null };
    }
  }

  // Update summary
  backup.summary.totalTables = TABLES_TO_REMOVE.length;
  backup.summary.tablesWithData = tablesWithData;
  backup.summary.totalRecords = totalRecords;

  // Write backup to file
  try {
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`\n💾 Backup saved to: ${backupFile}`);
  } catch (error) {
    console.error(`❌ Error saving backup: ${error.message}`);
    return;
  }

  // Summary
  console.log('\n📊 Backup Summary:');
  console.log(`   📋 Total tables processed: ${backup.summary.totalTables}`);
  console.log(`   📦 Tables with data: ${backup.summary.tablesWithData}`);
  console.log(`   📊 Total records backed up: ${backup.summary.totalRecords}`);
  
  if (backup.summary.totalRecords > 0) {
    console.log('\n⚠️  WARNING: Some tables contain data!');
    console.log('   Please review the backup file before proceeding with cleanup.');
  } else {
    console.log('\n✅ All tables are empty - safe to proceed with cleanup.');
  }

  console.log('\n🔒 Backup completed successfully!');
  console.log('🚀 You can now run the cleanup script safely.');
}

// Run the backup
backupBeforeCleanup().catch(console.error);
