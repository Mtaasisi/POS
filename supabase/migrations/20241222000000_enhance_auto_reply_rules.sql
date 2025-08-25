-- Enhance WhatsApp auto-reply rules table with advanced features
ALTER TABLE whatsapp_auto_reply_rules 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS delay_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses_per_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_uses_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '{}';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_priority ON whatsapp_auto_reply_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_category ON whatsapp_auto_reply_rules(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_rules_last_used ON whatsapp_auto_reply_rules(last_used_at);

-- Create WhatsApp sender groups table for grouping contacts
CREATE TABLE IF NOT EXISTS whatsapp_sender_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  sender_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sender groups
ALTER TABLE whatsapp_sender_groups ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to sender groups
CREATE POLICY "Admin can manage sender groups" ON whatsapp_sender_groups
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default sender groups
INSERT INTO whatsapp_sender_groups (name, description, sender_ids)
VALUES 
  ('VIP Customers', 'High-value customers', ARRAY['255746605561@c.us']),
  ('Regular Customers', 'Regular customers', ARRAY[]::text[]),
  ('Staff', 'Internal staff members', ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Update existing rules with default values for new fields
UPDATE whatsapp_auto_reply_rules 
SET 
  priority = 1,
  category = 'general',
  delay_seconds = 0,
  max_uses_per_day = 0,
  current_uses_today = 0,
  conditions = '{}',
  variables = '{}'
WHERE priority IS NULL;
