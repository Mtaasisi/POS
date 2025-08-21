-- Remove WhatsApp-related settings from the settings table
-- This migration cleans up all WhatsApp configuration that is no longer needed

-- Delete WhatsApp-related settings
DELETE FROM settings WHERE key LIKE 'whatsapp_%';

-- Delete WhatsApp webhook settings
DELETE FROM settings WHERE key IN (
  'whatsapp_business_webhook_verify_token',
  'whatsapp_business_webhook_url'
);
