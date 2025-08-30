-- Update WhatsApp messages table to support interactive buttons and message source tracking
-- This migration adds support for interactive_buttons and source field

-- Add source column if it doesn't exist
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('api', 'phone', 'webhook')) DEFAULT 'api';

-- Add green_api_message_id column if it doesn't exist
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS green_api_message_id TEXT;

-- Drop the existing CHECK constraint and recreate with interactive_buttons support
ALTER TABLE whatsapp_messages 
DROP CONSTRAINT IF EXISTS whatsapp_messages_type_check;

ALTER TABLE whatsapp_messages 
ADD CONSTRAINT whatsapp_messages_type_check 
CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll', 'interactive_buttons'));

-- Create index on source for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_source ON whatsapp_messages(source);

-- Create index on green_api_message_id for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_green_api_id ON whatsapp_messages(green_api_message_id);

-- Create composite index for better webhook processing performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_chat_timestamp 
ON whatsapp_messages(instance_id, chat_id, timestamp DESC);

-- Update RLS policies if needed (they should already allow authenticated users)
-- No changes needed as existing policies are sufficient

-- Add comment to table for documentation
COMMENT ON COLUMN whatsapp_messages.source IS 'Source of the message: api (sent via API), phone (sent from phone), webhook (received via webhook)';
COMMENT ON COLUMN whatsapp_messages.green_api_message_id IS 'Message ID from Green-API for tracking and correlation';
COMMENT ON COLUMN whatsapp_messages.type IS 'Message type including interactive_buttons for button messages';
