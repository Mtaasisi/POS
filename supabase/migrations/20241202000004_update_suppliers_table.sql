-- Migration to update lats_suppliers table with additional fields
-- This migration adds the missing fields that the SupplierForm component expects

-- Add new columns to lats_suppliers table
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS phone2 TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS wechat_id TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS payment_account_type TEXT CHECK (payment_account_type IN ('mobile_money', 'bank_account', 'other')),
ADD COLUMN IF NOT EXISTS mobile_money_account TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add comments to document the new fields
COMMENT ON COLUMN lats_suppliers.company_name IS 'Company name that the supplier represents';
COMMENT ON COLUMN lats_suppliers.description IS 'Detailed description of the supplier';
COMMENT ON COLUMN lats_suppliers.phone2 IS 'Secondary phone number';
COMMENT ON COLUMN lats_suppliers.whatsapp IS 'WhatsApp business number';
COMMENT ON COLUMN lats_suppliers.instagram IS 'Instagram handle';
COMMENT ON COLUMN lats_suppliers.wechat_id IS 'WeChat business account ID';
COMMENT ON COLUMN lats_suppliers.city IS 'City where supplier is located';
COMMENT ON COLUMN lats_suppliers.country IS 'Country where supplier is located';
COMMENT ON COLUMN lats_suppliers.payment_account_type IS 'Type of payment account (mobile_money, bank_account, other)';
COMMENT ON COLUMN lats_suppliers.mobile_money_account IS 'Mobile money phone number';
COMMENT ON COLUMN lats_suppliers.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN lats_suppliers.bank_name IS 'Name of the bank';

-- Create index on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_country ON lats_suppliers(country);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_city ON lats_suppliers(city);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_payment_type ON lats_suppliers(payment_account_type);
