import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables to be removed (identified as useless from deep research)
const TABLES_TO_REMOVE = [
  // Debug/Log Tables (No code references)
  'uuid_diagnostic_log',
  'inventory_whatsapp_events',
  'product_inquiry_history',
  'inventory_alerts',
  
  // Redundant Settings Tables (No code references)
  'settings_backups',
  'settings_history',
  'settings_schema',
  
  // Unused Feature Tables (No code references)
  'redemption_rewards',
  'redemption_transactions',
  'return_items',
  'return_remarks',
  'returns',
  'returns_refunds',
  'scheduled_whatsapp_messages',
  
  // Redundant WhatsApp Tables (Multiple versions or no code references)
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
  
  // Other Unused Tables (No code references)
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

async function cleanupUselessTables() {
  console.log('🧹 Starting Database Cleanup - Removing Useless Tables\n');
  console.log(`📋 Found ${TABLES_TO_REMOVE.length} tables to remove\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const tableName of TABLES_TO_REMOVE) {
    try {
      console.log(`🗑️  Removing table: ${tableName}`);
      
      // First check if table exists
      const { data: checkData, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        console.log(`   ⚠️  Table '${tableName}' does not exist, skipping...`);
        continue;
      }

      // Drop the table using RPC
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
      });

      if (dropError) {
        console.log(`   ❌ Error removing '${tableName}': ${dropError.message}`);
        errorCount++;
        errors.push({ table: tableName, error: dropError.message });
      } else {
        console.log(`   ✅ Successfully removed '${tableName}'`);
        successCount++;
      }

      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.log(`   ❌ Unexpected error removing '${tableName}': ${error.message}`);
      errorCount++;
      errors.push({ table: tableName, error: error.message });
    }
  }

  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   ✅ Successfully removed: ${successCount} tables`);
  console.log(`   ❌ Failed to remove: ${errorCount} tables`);
  console.log(`   📋 Total processed: ${TABLES_TO_REMOVE.length} tables`);

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(({ table, error }) => {
      console.log(`   - ${table}: ${error}`);
    });
  }

  console.log('\n🎉 Database cleanup completed!');
  console.log('💾 Your database is now cleaner and more efficient.');
}

// Run the cleanup
cleanupUselessTables().catch(console.error);
