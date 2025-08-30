-- Add support for interactive_buttons message type
-- This migration updates the CHECK constraint in green_api_message_queue table to support interactive buttons

-- Drop the existing CHECK constraint
ALTER TABLE green_api_message_queue 
DROP CONSTRAINT IF EXISTS green_api_message_queue_message_type_check;

-- Add the updated CHECK constraint that includes interactive_buttons
ALTER TABLE green_api_message_queue 
ADD CONSTRAINT green_api_message_queue_message_type_check 
CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll', 'interactive_buttons'));

-- Also update whatsapp_messages table to support interactive_buttons if it exists
DO $$
BEGIN
    -- Check if whatsapp_messages table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_messages') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE whatsapp_messages 
        DROP CONSTRAINT IF EXISTS whatsapp_messages_type_check;
        
        -- Add updated constraint
        ALTER TABLE whatsapp_messages 
        ADD CONSTRAINT whatsapp_messages_type_check 
        CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll', 'interactive_buttons'));
    END IF;
END $$;

-- Also update chat_messages table to support interactive_buttons if it exists  
DO $$
BEGIN
    -- Check if chat_messages table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE chat_messages 
        DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
        
        -- Add updated constraint
        ALTER TABLE chat_messages 
        ADD CONSTRAINT chat_messages_message_type_check 
        CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll', 'interactive_buttons'));
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON CONSTRAINT green_api_message_queue_message_type_check ON green_api_message_queue 
IS 'Validates message_type field - supports text, image, video, audio, document, location, contact, sticker, poll, and interactive_buttons';
