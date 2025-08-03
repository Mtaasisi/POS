-- Setup Integrations Table (Fixed Version)
-- Run this in your Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_integrations_updated_at();

-- Create integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'ai', 'analytics', 'payment', 'storage', 'whatsapp')),
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON integrations;
DROP POLICY IF EXISTS "Allow all operations for service role" ON integrations;
DROP POLICY IF EXISTS "Allow all operations for anon" ON integrations;

-- Create new policies
CREATE POLICY "Allow all operations for authenticated users" ON integrations
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for service role" ON integrations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for anon" ON integrations
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_integrations_updated_at();

-- Insert default integrations (with conflict handling)
INSERT INTO integrations (name, type, provider, config, is_active) VALUES
  ('Mobishastra SMS', 'sms', 'mobishastra', '{
    "username": "Inauzwa",
    "password": "@Masika10",
    "sender_id": "INAUZWA",
    "api_url": "https://mshastra.com/sendurl.aspx",
    "balance_url": "https://mshastra.com/balance.aspx"
  }', true),
  ('WhatsApp Green API', 'whatsapp', 'green-api', '{
    "instance_id": "",
    "api_key": ""
  }', false),
  ('Gemini AI', 'ai', 'google', '{
    "api_key": "",
    "model": "gemini-pro"
  }', false),
  ('Supabase Database', 'storage', 'supabase', '{
    "url": "https://jxhzveborezjhsmzsgbc.supabase.co",
    "anon_key": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw"
  }', true)
ON CONFLICT (name) DO UPDATE SET
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the setup
SELECT 
  'Integrations table created successfully' as status,
  COUNT(*) as total_integrations
FROM integrations; 