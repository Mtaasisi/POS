-- Enhanced WhatsApp Instances Comprehensive Table
-- This enhances the existing table with additional columns for Green API features

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
