-- Master Migration Script for WhatsApp Connection Manager Enhancements
-- This script runs all the enhancement migrations in the correct order

-- Note: Using standard SQL comments instead of psql \echo commands for compatibility

-- =============================================
-- Step 1: Authorization Codes Table
-- =============================================
-- Running whatsapp_authorization_codes.sql...

-- WhatsApp Authorization Codes Table
-- This table stores authorization codes for Green API phone number linking

CREATE TABLE IF NOT EXISTS whatsapp_authorization_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    instance_id VARCHAR(50) NOT NULL REFERENCES whatsapp_instances_comprehensive(instance_id) ON DELETE CASCADE,
    
    -- Authorization code details
    authorization_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    
    -- Status and timing
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(instance_id, authorization_code)
);

-- Enable Row Level Security
ALTER TABLE whatsapp_authorization_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_authorization_codes' 
        AND policyname = 'Users can view their own authorization codes'
    ) THEN
        CREATE POLICY "Users can view their own authorization codes" 
        ON whatsapp_authorization_codes FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_authorization_codes' 
        AND policyname = 'Users can insert their own authorization codes'
    ) THEN
        CREATE POLICY "Users can insert their own authorization codes" 
        ON whatsapp_authorization_codes FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_authorization_codes' 
        AND policyname = 'Users can update their own authorization codes'
    ) THEN
        CREATE POLICY "Users can update their own authorization codes" 
        ON whatsapp_authorization_codes FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_authorization_codes' 
        AND policyname = 'Users can delete their own authorization codes'
    ) THEN
        CREATE POLICY "Users can delete their own authorization codes" 
        ON whatsapp_authorization_codes FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_codes_user_id ON whatsapp_authorization_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_instance_id ON whatsapp_authorization_codes(instance_id);
CREATE INDEX IF NOT EXISTS idx_auth_codes_phone ON whatsapp_authorization_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON whatsapp_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_used ON whatsapp_authorization_codes(is_used);

-- Create trigger for updated_at (only if function exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_updated_at_column'
    ) THEN
        DROP TRIGGER IF EXISTS update_whatsapp_auth_codes_updated_at ON whatsapp_authorization_codes;
        CREATE TRIGGER update_whatsapp_auth_codes_updated_at 
        BEFORE UPDATE ON whatsapp_authorization_codes 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- Step 2: Enhanced QR Codes Table
-- =============================================
-- Running whatsapp_qr_codes_enhanced.sql...

-- First, check if qr_code column exists and add it if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN qr_code TEXT;
    END IF;
END $$;

-- Add additional columns if they don't exist
DO $$
BEGIN
    -- Add WebSocket support columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'generation_method'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN generation_method VARCHAR(20) DEFAULT 'http' CHECK (generation_method IN ('http', 'websocket'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'websocket_status'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN websocket_status VARCHAR(20) DEFAULT 'pending' CHECK (websocket_status IN ('pending', 'generated', 'scanned', 'expired', 'failed'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'retry_count'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN retry_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'max_retries'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN max_retries INTEGER DEFAULT 3;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'last_error'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN last_error TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_qr_codes' 
        AND column_name = 'scanned_at'
    ) THEN
        ALTER TABLE whatsapp_qr_codes ADD COLUMN scanned_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_method ON whatsapp_qr_codes(generation_method);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_ws_status ON whatsapp_qr_codes(websocket_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_retry ON whatsapp_qr_codes(retry_count);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_expires ON whatsapp_qr_codes(expires_at);

-- Create cleanup function for expired QR codes
CREATE OR REPLACE FUNCTION cleanup_expired_qr_codes()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    DELETE FROM whatsapp_qr_codes 
    WHERE expires_at < NOW() 
    AND (websocket_status = 'expired' OR websocket_status = 'failed');
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Step 3: Enhanced Instances Table
-- =============================================
-- Running whatsapp_instances_comprehensive_enhanced.sql...

-- Add additional columns if they don't exist
DO $$
BEGIN
    -- Health monitoring columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'health_score'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'error_count'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN error_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'last_error'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN last_error TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'last_error_at'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN last_error_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Operation tracking columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'last_reboot_at'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN last_reboot_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'last_logout_at'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN last_logout_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'reboot_count'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN reboot_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'logout_count'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN logout_count INTEGER DEFAULT 0;
    END IF;

    -- Token and profile management
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'token_updated_at'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN token_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'profile_picture_updated_at'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN profile_picture_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Additional device information
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'device_id'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN device_id VARCHAR(100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'battery_level'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_instances_comprehensive' 
        AND column_name = 'platform'
    ) THEN
        ALTER TABLE whatsapp_instances_comprehensive ADD COLUMN platform VARCHAR(50);
    END IF;
END $$;

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_health ON whatsapp_instances_comprehensive(health_score);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_errors ON whatsapp_instances_comprehensive(error_count);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_device ON whatsapp_instances_comprehensive(device_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_platform ON whatsapp_instances_comprehensive(platform);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_last_error ON whatsapp_instances_comprehensive(last_error_at);

-- Create function to calculate health score
CREATE OR REPLACE FUNCTION calculate_instance_health_score(
    p_instance_id VARCHAR(50)
)
RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 100;
    error_penalty INTEGER;
    connection_bonus INTEGER := 0;
    recent_activity_bonus INTEGER := 0;
BEGIN
    -- Get instance data
    SELECT 
        LEAST(error_count * 5, 50),  -- Max 50 point penalty for errors
        CASE 
            WHEN status = 'connected' THEN 10
            WHEN status = 'connecting' THEN 5
            ELSE 0
        END,
        CASE 
            WHEN last_activity_at > NOW() - INTERVAL '1 hour' THEN 10
            WHEN last_activity_at > NOW() - INTERVAL '24 hours' THEN 5
            ELSE 0
        END
    INTO error_penalty, connection_bonus, recent_activity_bonus
    FROM whatsapp_instances_comprehensive
    WHERE instance_id = p_instance_id;
    
    RETURN GREATEST(0, base_score - error_penalty + connection_bonus + recent_activity_bonus);
END;
$$ LANGUAGE plpgsql;

-- Create function to update health scores
CREATE OR REPLACE FUNCTION update_all_health_scores()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    instance_record RECORD;
BEGIN
    FOR instance_record IN 
        SELECT instance_id FROM whatsapp_instances_comprehensive
    LOOP
        UPDATE whatsapp_instances_comprehensive 
        SET health_score = calculate_instance_health_score(instance_record.instance_id),
            updated_at = NOW()
        WHERE instance_id = instance_record.instance_id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Step 4: Enhanced Settings Table  
-- =============================================
-- Running whatsapp_connection_settings_enhanced.sql...

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

-- =============================================
-- Completed WhatsApp Connection Manager Enhancements
-- =============================================

-- Summary of changes:
-- 1. Created whatsapp_authorization_codes table
-- 2. Enhanced whatsapp_qr_codes table with WebSocket support
-- 3. Enhanced whatsapp_instances_comprehensive with health monitoring
-- 4. Enhanced whatsapp_connection_settings with advanced features
-- 5. Added comprehensive indexes and RLS policies
-- 6. Created utility functions for health scoring and cleanup
