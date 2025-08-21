-- Add back WhatsApp column to customers table
-- This migration restores the whatsapp field that was previously removed

-- Add the whatsapp column back to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN customers.whatsapp IS 'WhatsApp phone number for the customer';

-- Create an index on whatsapp for better search performance
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);
