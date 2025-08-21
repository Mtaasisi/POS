-- Add API URL and Media URL columns to whatsapp_instances table
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS api_url TEXT,
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add comments for documentation
COMMENT ON COLUMN whatsapp_instances.api_url IS 'Green API base URL for this instance';
COMMENT ON COLUMN whatsapp_instances.media_url IS 'Green API media URL for this instance';
COMMENT ON COLUMN whatsapp_instances.name IS 'Display name for this WhatsApp instance';
