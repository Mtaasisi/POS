-- Create lats_shipping_agent_contacts table
-- This migration adds support for multiple contacts per shipping agent

-- Create the contacts table
CREATE TABLE IF NOT EXISTS lats_shipping_agent_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES lats_shipping_agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('manager', 'sales', 'support', 'operations', 'other')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_agent_contacts_agent_id ON lats_shipping_agent_contacts(agent_id);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_contacts_role ON lats_shipping_agent_contacts(role);
CREATE INDEX IF NOT EXISTS idx_shipping_agent_contacts_is_primary ON lats_shipping_agent_contacts(is_primary);

-- Add RLS policies
ALTER TABLE lats_shipping_agent_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read contacts
CREATE POLICY "Users can read shipping agent contacts" ON lats_shipping_agent_contacts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert contacts
CREATE POLICY "Users can insert shipping agent contacts" ON lats_shipping_agent_contacts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update contacts
CREATE POLICY "Users can update shipping agent contacts" ON lats_shipping_agent_contacts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete contacts
CREATE POLICY "Users can delete shipping agent contacts" ON lats_shipping_agent_contacts
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE lats_shipping_agent_contacts IS 'Contact persons for shipping agents';
COMMENT ON COLUMN lats_shipping_agent_contacts.agent_id IS 'Reference to the shipping agent';
COMMENT ON COLUMN lats_shipping_agent_contacts.name IS 'Contact person name';
COMMENT ON COLUMN lats_shipping_agent_contacts.phone IS 'Primary phone number';
COMMENT ON COLUMN lats_shipping_agent_contacts.whatsapp IS 'WhatsApp number (optional)';
COMMENT ON COLUMN lats_shipping_agent_contacts.email IS 'Email address (optional)';
COMMENT ON COLUMN lats_shipping_agent_contacts.role IS 'Contact role: manager, sales, support, operations, or other';
COMMENT ON COLUMN lats_shipping_agent_contacts.is_primary IS 'Indicates if this is the primary contact';

