-- Add customer_id column to whatsapp_messages table
-- This migration fixes the 400 Bad Request errors when querying whatsapp_messages

-- Add customer_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE whatsapp_messages ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for customer_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON whatsapp_messages(customer_id);

-- Update RLS policies to include customer_id
DROP POLICY IF EXISTS "Users can view messages" ON whatsapp_messages;
CREATE POLICY "Users can view messages" ON whatsapp_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert messages" ON whatsapp_messages;
CREATE POLICY "Users can insert messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update messages" ON whatsapp_messages;
CREATE POLICY "Users can update messages" ON whatsapp_messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);
