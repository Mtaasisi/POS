-- Recreate WhatsApp Messages Table
-- This migration recreates the whatsapp_messages table that was dropped
-- by the 20250125000000_remove_whatsapp_features.sql migration

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create WhatsApp messages table with unified schema
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at_trigger
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_messages_updated_at();
