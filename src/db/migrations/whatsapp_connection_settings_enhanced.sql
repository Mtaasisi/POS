-- Enhanced WhatsApp Connection Settings Table
-- This enhances the existing table with additional Green API settings

-- Add additional columns if they don't exist
DO $$
BEGIN
    -- Sync and status tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'sync_status'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'last_sync_at'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'sync_error'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN sync_error TEXT;
    END IF;

    -- Additional webhook settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'webhook_auth_header'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN webhook_auth_header VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'webhook_retry_count'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN webhook_retry_count INTEGER DEFAULT 3;
    END IF;

    -- Message and file settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'shared_session'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN shared_session VARCHAR(10) DEFAULT 'no' CHECK (shared_session IN ('yes', 'no'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'proxy_instance'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN proxy_instance VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'media_setting'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN media_setting VARCHAR(20) DEFAULT 'sync' CHECK (media_setting IN ('sync', 'not_sync'));
    END IF;

    -- Performance settings
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'delay_send_messages_seconds'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN delay_send_messages_seconds INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'enable_typing'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN enable_typing VARCHAR(10) DEFAULT 'no' CHECK (enable_typing IN ('yes', 'no'));
    END IF;

    -- Backup and restore
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'settings_backup'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN settings_backup JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_connection_settings' 
        AND column_name = 'backup_created_at'
    ) THEN
        ALTER TABLE whatsapp_connection_settings ADD COLUMN backup_created_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_sync_status ON whatsapp_connection_settings(sync_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_sync_time ON whatsapp_connection_settings(last_sync_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_backup ON whatsapp_connection_settings(backup_created_at);

-- Create function to backup current settings
CREATE OR REPLACE FUNCTION backup_instance_settings(
    p_instance_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    current_settings JSONB;
BEGIN
    -- Get current settings as JSON
    SELECT to_jsonb(row_to_json(wcs)) INTO current_settings
    FROM whatsapp_connection_settings wcs
    WHERE instance_id = p_instance_id;
    
    -- Update backup fields
    UPDATE whatsapp_connection_settings 
    SET 
        settings_backup = current_settings,
        backup_created_at = NOW(),
        updated_at = NOW()
    WHERE instance_id = p_instance_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to restore settings from backup
CREATE OR REPLACE FUNCTION restore_instance_settings(
    p_instance_id VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    backup_settings JSONB;
BEGIN
    -- Get backup settings
    SELECT settings_backup INTO backup_settings
    FROM whatsapp_connection_settings
    WHERE instance_id = p_instance_id AND settings_backup IS NOT NULL;
    
    IF backup_settings IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Note: This is a simplified restore - in practice, you'd need to 
    -- parse the JSON and update individual fields
    UPDATE whatsapp_connection_settings 
    SET 
        sync_status = 'pending',
        updated_at = NOW()
    WHERE instance_id = p_instance_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get default settings
CREATE OR REPLACE FUNCTION get_default_whatsapp_settings()
RETURNS TABLE (
    setting_name TEXT,
    setting_value TEXT,
    setting_description TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
        ('webhook_url', '', 'URL for receiving webhooks'),
        ('webhook_url_token', '', 'Token for webhook authentication'),
        ('mark_incoming_messages_readed', 'no', 'Auto-mark incoming messages as read'),
        ('mark_incoming_messages_readed_on_reply', 'no', 'Mark messages as read when replying'),
        ('delay_send_messages_milliseconds', '1000', 'Delay between sending messages (ms)'),
        ('incoming_webhook', 'yes', 'Enable incoming message webhooks'),
        ('outgoing_webhook', 'yes', 'Enable outgoing message webhooks'),
        ('outgoing_message_webhook', 'yes', 'Enable outgoing API message webhooks'),
        ('outgoing_api_message_webhook', 'yes', 'Enable outgoing API webhooks'),
        ('state_webhook', 'yes', 'Enable state change webhooks'),
        ('device_webhook', 'yes', 'Enable device status webhooks'),
        ('incoming_call_webhook', 'no', 'Enable incoming call webhooks'),
        ('poll_message_webhook', 'no', 'Enable poll message webhooks'),
        ('edited_message_webhook', 'no', 'Enable edited message webhooks'),
        ('deleted_message_webhook', 'no', 'Enable deleted message webhooks'),
        ('incoming_block_webhook', 'no', 'Enable block/unblock webhooks'),
        ('keep_online_status', 'no', 'Keep WhatsApp status as online'),
        ('shared_session', 'no', 'Enable shared session'),
        ('media_setting', 'sync', 'Media synchronization setting'),
        ('enable_typing', 'no', 'Show typing indicator');
END;
$$ LANGUAGE plpgsql;
