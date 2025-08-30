import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables that should remain after cleanup
const ESSENTIAL_TABLES = [
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
  
  // WhatsApp Tables (Used)
  'whatsapp_instances_comprehensive',
  'whatsapp_connection_settings',
  'whatsapp_qr_codes',
  'whatsapp_messages',
  'whatsapp_message_templates',
  'whatsapp_hub_settings',
  
  // Green API Tables (Used)
  'green_api_message_queue',
  'green_api_message_templates',
  'green_api_bulk_campaigns',
  'green_api_bulk_campaign_results',
  'green_api_webhook_events',
  'green_api_settings',
  
  // POS Settings Tables (Used)
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
  
  // Other Used Tables
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
  'user_settings',
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
  'product_images',
  'audit_logs'
];

// Tables that should be removed
const REMOVED_TABLES = [
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

async function verifyCleanupResults() {
  console.log('🔍 Verifying Cleanup Results\n');

  const results = {
    essentialTables: { exists: 0, missing: 0, details: {} },
    removedTables: { stillExists: 0, properlyRemoved: 0, details: {} },
    summary: { totalEssential: ESSENTIAL_TABLES.length, totalRemoved: REMOVED_TABLES.length }
  };

  // Check essential tables
  console.log('📋 Checking Essential Tables (should exist):');
  for (const tableName of ESSENTIAL_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`   ❌ Missing essential table: ${tableName}`);
        results.essentialTables.missing++;
        results.essentialTables.details[tableName] = { exists: false, error: 'Table not found' };
      } else {
        console.log(`   ✅ Essential table exists: ${tableName}`);
        results.essentialTables.exists++;
        results.essentialTables.details[tableName] = { exists: true };
      }

      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.log(`   ❌ Error checking essential table '${tableName}': ${error.message}`);
      results.essentialTables.missing++;
      results.essentialTables.details[tableName] = { exists: false, error: error.message };
    }
  }

  console.log('\n🗑️  Checking Removed Tables (should not exist):');
  for (const tableName of REMOVED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`   ✅ Properly removed: ${tableName}`);
        results.removedTables.properlyRemoved++;
        results.removedTables.details[tableName] = { exists: false };
      } else {
        console.log(`   ❌ Still exists (not removed): ${tableName}`);
        results.removedTables.stillExists++;
        results.removedTables.details[tableName] = { exists: true };
      }

      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.log(`   ❌ Error checking removed table '${tableName}': ${error.message}`);
      results.removedTables.stillExists++;
      results.removedTables.details[tableName] = { exists: true, error: error.message };
    }
  }

  // Summary
  console.log('\n📊 Verification Summary:');
  console.log(`   ✅ Essential tables found: ${results.essentialTables.exists}/${results.summary.totalEssential}`);
  console.log(`   ❌ Essential tables missing: ${results.essentialTables.missing}`);
  console.log(`   ✅ Removed tables properly deleted: ${results.removedTables.properlyRemoved}/${results.summary.totalRemoved}`);
  console.log(`   ❌ Removed tables still exist: ${results.removedTables.stillExists}`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (results.essentialTables.missing > 0) {
    console.log('   ⚠️  Some essential tables are missing!');
    console.log('   🔧 You may need to recreate missing tables.');
  }
  
  if (results.removedTables.stillExists > 0) {
    console.log('   ⚠️  Some tables that should be removed still exist!');
    console.log('   🔧 You may need to manually remove these tables.');
  }
  
  if (results.essentialTables.missing === 0 && results.removedTables.stillExists === 0) {
    console.log('   🎉 Perfect! All essential tables exist and all useless tables were removed.');
    console.log('   🚀 Your database cleanup was successful!');
  }

  return results;
}

// Run the verification
verifyCleanupResults().catch(console.error);
