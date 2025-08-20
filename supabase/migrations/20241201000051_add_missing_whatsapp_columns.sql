-- Add missing columns to whatsapp_messages table

-- Add message_id column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS message_id VARCHAR(255) UNIQUE;

-- Add message_timestamp column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS message_timestamp TIMESTAMP WITH TIME ZONE;

-- Add is_from_me column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS is_from_me BOOLEAN NOT NULL DEFAULT false;

-- Add customer_phone column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Add customer_name column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Add processed column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT false;

-- Add auto_replied column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS auto_replied BOOLEAN NOT NULL DEFAULT false;

-- Add updated_at column
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_timestamp ON whatsapp_messages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_phone ON whatsapp_messages(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_processed ON whatsapp_messages(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_auto_replied ON whatsapp_messages(auto_replied);

-- Add trigger for updated_at column
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_messages_updated_at_trigger
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_messages_updated_at();
