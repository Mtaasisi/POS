-- Fix WhatsApp messages table schema conflicts
-- This migration resolves the differences between the two table definitions

-- Drop the conflicting table if it exists
DROP TABLE IF EXISTS whatsapp_messages CASCADE;

-- Create the unified whatsapp_messages table with all necessary fields
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  instance_id TEXT,
  chat_id TEXT,
  sender_id TEXT,
  sender_name TEXT,
  type TEXT CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker', 'poll')) DEFAULT 'text',
  content TEXT NOT NULL,
  message TEXT,
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT CHECK (status IN ('sent', 'delivered', 'read', 'failed')) DEFAULT 'sent',
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_id ON whatsapp_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_chat_id ON whatsapp_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_id ON whatsapp_messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view messages" ON whatsapp_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update messages" ON whatsapp_messages
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at 
    BEFORE UPDATE ON whatsapp_messages 
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_messages_updated_at();

-- Insert some sample data for testing
INSERT INTO whatsapp_messages (id, sender_id, sender_name, content, message, direction, status, timestamp)
VALUES 
  ('msg_001', '255746605561@c.us', 'Test User', 'Hello there!', 'Hello there!', 'incoming', 'read', NOW() - INTERVAL '1 hour'),
  ('msg_002', 'system', 'System', 'Welcome to our service!', 'Welcome to our service!', 'outgoing', 'sent', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;
