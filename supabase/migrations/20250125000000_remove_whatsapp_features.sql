-- Remove WhatsApp Features Migration
-- This migration removes all WhatsApp-related tables and data

-- Drop WhatsApp-related tables
DROP TABLE IF EXISTS whatsapp_auto_reply_rules CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_notifications CASCADE;
DROP TABLE IF EXISTS whatsapp_message_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_automation_workflows CASCADE;
DROP TABLE IF EXISTS whatsapp_automation_executions CASCADE;
DROP TABLE IF EXISTS whatsapp_analytics_events CASCADE;
DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS whatsapp_bulk_message_results CASCADE;
DROP TABLE IF EXISTS whatsapp_escalations CASCADE;
DROP TABLE IF EXISTS whatsapp_contact_preferences CASCADE;
DROP TABLE IF EXISTS inventory_whatsapp_events CASCADE;
DROP TABLE IF EXISTS product_inquiry_history CASCADE;
DROP TABLE IF EXISTS inventory_alerts CASCADE;
DROP TABLE IF EXISTS customer_product_preferences CASCADE;
DROP TABLE IF EXISTS whatsapp_auto_reply_rules_compat CASCADE;

-- Remove WhatsApp columns from existing tables
ALTER TABLE customers DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE lats_suppliers DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE store_locations DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE appointments DROP COLUMN IF EXISTS whatsapp_reminder_sent;

-- Remove WhatsApp settings
DELETE FROM settings WHERE key LIKE 'whatsapp.%';
DELETE FROM settings WHERE key LIKE 'greenapi.%';
DELETE FROM settings WHERE key LIKE 'GREENAPI_%';

-- Remove WhatsApp-related functions
DROP FUNCTION IF EXISTS update_whatsapp_notifications_updated_at() CASCADE;

-- Clean up audit logs
DELETE FROM audit_logs WHERE action LIKE '%whatsapp%' OR action LIKE '%WhatsApp%';

-- Remove WhatsApp-related indexes
DROP INDEX IF EXISTS idx_whatsapp_messages_timestamp;
DROP INDEX IF EXISTS idx_whatsapp_messages_sender_id;
DROP INDEX IF EXISTS idx_whatsapp_messages_chat_id;
DROP INDEX IF EXISTS idx_whatsapp_messages_instance_id;
DROP INDEX IF EXISTS idx_whatsapp_messages_direction;
DROP INDEX IF EXISTS idx_whatsapp_messages_status;
DROP INDEX IF EXISTS idx_whatsapp_notifications_customer_id;
DROP INDEX IF EXISTS idx_whatsapp_notifications_status;
DROP INDEX IF EXISTS idx_whatsapp_notifications_created_at;
DROP INDEX IF EXISTS idx_whatsapp_templates_category;
DROP INDEX IF EXISTS idx_whatsapp_templates_active;
DROP INDEX IF EXISTS idx_whatsapp_workflows_trigger;
DROP INDEX IF EXISTS idx_whatsapp_workflows_active;
DROP INDEX IF EXISTS idx_whatsapp_executions_workflow_id;
DROP INDEX IF EXISTS idx_whatsapp_executions_status;
DROP INDEX IF EXISTS idx_whatsapp_analytics_event_type;
DROP INDEX IF EXISTS idx_whatsapp_analytics_timestamp;
DROP INDEX IF EXISTS idx_whatsapp_auto_reply_rules_active;
DROP INDEX IF EXISTS idx_whatsapp_auto_reply_rules_priority;
DROP INDEX IF EXISTS idx_whatsapp_campaigns_status;
DROP INDEX IF EXISTS idx_whatsapp_campaigns_created_at;
DROP INDEX IF EXISTS idx_whatsapp_bulk_results_campaign_id;
DROP INDEX IF EXISTS idx_whatsapp_bulk_results_status;
DROP INDEX IF EXISTS idx_whatsapp_escalations_status;
DROP INDEX IF EXISTS idx_whatsapp_escalations_priority;
DROP INDEX IF EXISTS idx_whatsapp_contact_preferences_customer_id;
DROP INDEX IF EXISTS idx_whatsapp_contact_preferences_phone;
DROP INDEX IF EXISTS idx_inventory_whatsapp_events_event_type;
DROP INDEX IF EXISTS idx_inventory_whatsapp_events_product_id;
DROP INDEX IF EXISTS idx_product_inquiry_history_customer_id;
DROP INDEX IF EXISTS idx_product_inquiry_history_created_at;
DROP INDEX IF EXISTS idx_inventory_alerts_alert_type;
DROP INDEX IF EXISTS idx_inventory_alerts_product_id;
DROP INDEX IF EXISTS idx_customer_product_preferences_customer_id;
DROP INDEX IF EXISTS idx_customer_product_preferences_product_id;

-- Commit the changes
COMMIT;
