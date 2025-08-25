-- Add Green API Configuration to WhatsApp Hub Settings
-- This migration adds fields to store Green API credentials and configuration

-- Add Green API configuration columns
ALTER TABLE whatsapp_hub_settings 
ADD COLUMN green_api_instance_id VARCHAR(50),
ADD COLUMN green_api_token VARCHAR(255),
ADD COLUMN green_api_url VARCHAR(255) DEFAULT 'https://api.green-api.com';

-- Add comments for the new columns
COMMENT ON COLUMN whatsapp_hub_settings.green_api_instance_id IS 'Green API instance ID for WhatsApp integration';
COMMENT ON COLUMN whatsapp_hub_settings.green_api_token IS 'Green API authentication token';
COMMENT ON COLUMN whatsapp_hub_settings.green_api_url IS 'Green API base URL (defaults to https://api.green-api.com)';

-- Create index for Green API instance ID for better performance
CREATE INDEX idx_whatsapp_hub_settings_green_api_instance ON whatsapp_hub_settings(green_api_instance_id);

-- Add validation constraints
ALTER TABLE whatsapp_hub_settings 
ADD CONSTRAINT check_green_api_url 
CHECK (green_api_url IS NULL OR green_api_url ~ '^https?://.*');

-- Update existing settings with default Green API URL if not set
UPDATE whatsapp_hub_settings 
SET green_api_url = 'https://api.green-api.com' 
WHERE green_api_url IS NULL;
