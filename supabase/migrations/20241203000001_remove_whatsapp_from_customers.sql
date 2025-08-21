-- Remove WhatsApp column from customers table
-- This migration removes the whatsapp field that is no longer needed

-- Remove the whatsapp column from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS whatsapp;
