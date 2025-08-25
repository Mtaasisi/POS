-- Populate green_api_settings table with default settings for existing instances
-- This migration uses the existing green_api_settings table structure

-- Get all existing instances and populate them with default settings
INSERT INTO green_api_settings (setting_key, setting_value, description, is_encrypted)
SELECT 
    CONCAT(wi.instance_id, '_', setting_name) as setting_key,
    setting_value,
    CONCAT('Default setting for instance ', wi.instance_id, ': ', setting_name) as description,
    false as is_encrypted
FROM whatsapp_instances wi
CROSS JOIN (
    VALUES 
        ('webhookUrl', ''),
        ('webhookUrlToken', ''),
        ('delaySendMessagesMilliseconds', '5000'),
        ('markIncomingMessagesReaded', 'no'),
        ('markIncomingMessagesReadedOnReply', 'no'),
        ('outgoingWebhook', 'yes'),
        ('outgoingMessageWebhook', 'yes'),
        ('outgoingAPIMessageWebhook', 'yes'),
        ('incomingWebhook', 'yes'),
        ('deviceWebhook', 'no'),
        ('stateWebhook', 'no'),
        ('keepOnlineStatus', 'no'),
        ('pollMessageWebhook', 'no'),
        ('incomingBlockWebhook', 'yes'),
        ('incomingCallWebhook', 'yes'),
        ('editedMessageWebhook', 'no'),
        ('deletedMessageWebhook', 'no')
) AS default_settings(setting_name, setting_value)
WHERE NOT EXISTS (
    SELECT 1 FROM green_api_settings gas 
    WHERE gas.setting_key = CONCAT(wi.instance_id, '_', setting_name)
);

-- Create index for better performance when querying settings by instance
CREATE INDEX IF NOT EXISTS idx_green_api_settings_instance_key 
ON green_api_settings (setting_key);

-- Add comment for documentation
COMMENT ON TABLE green_api_settings IS 'Green API settings stored as key-value pairs for each instance';
