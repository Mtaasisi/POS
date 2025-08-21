-- Add WhatsApp column back to customers table
-- This migration adds the whatsapp field that was previously removed

-- Add the whatsapp column back to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add comment for documentation
COMMENT ON COLUMN customers.whatsapp IS 'WhatsApp number for customer communication';
