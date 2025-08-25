-- Create WhatsApp auto-reply rules table
CREATE TABLE IF NOT EXISTS whatsapp_auto_reply_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger TEXT NOT NULL,
  response TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  case_sensitive BOOLEAN DEFAULT false,
  exact_match BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  direction TEXT CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_enabled ON whatsapp_auto_reply_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_id ON whatsapp_messages(sender_id);

-- Enable Row Level Security
ALTER TABLE whatsapp_auto_reply_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage auto-reply rules" ON whatsapp_auto_reply_rules
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can view messages" ON whatsapp_messages
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can insert messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert some default auto-reply rules
INSERT INTO whatsapp_auto_reply_rules (trigger, response, enabled, case_sensitive, exact_match)
VALUES 
  ('Hi', 'Mambo vipi', true, false, false),
  ('Hello', 'Hello! How can I help you today?', true, false, false)
ON CONFLICT DO NOTHING;
