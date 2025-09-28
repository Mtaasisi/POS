-- Enhanced WhatsApp QR Codes Table
-- This enhances the existing whatsapp_qr_codes table with additional columns

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
