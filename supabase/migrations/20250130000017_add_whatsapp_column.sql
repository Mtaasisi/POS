-- Add missing whatsapp column to lats_shipping_agents table
-- This fixes the 400 error when creating shipping agents

-- Add the whatsapp column to the shipping agents table
ALTER TABLE lats_shipping_agents 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add comment for documentation
COMMENT ON COLUMN lats_shipping_agents.whatsapp IS 'WhatsApp contact number for the shipping agent';
