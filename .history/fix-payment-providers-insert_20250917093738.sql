-- =====================================================
-- FIX PAYMENT PROVIDERS INSERT - WORK WITH EXISTING TABLE
-- =====================================================

-- First, let's check what columns exist in payment_providers table
-- Then insert data based on the actual table structure

-- Insert real payment providers (without provider_code if it doesn't exist)
INSERT INTO payment_providers (name, type, description) VALUES
('Cash', 'cash', 'Physical cash payments'),
('Card', 'card', 'Credit/Debit card payments'),
('M-Pesa', 'mobile_money', 'M-Pesa mobile money payments'),
('CRDB', 'bank_transfer', 'CRDB Bank transfer payments')
ON CONFLICT (name) DO NOTHING;

-- Alternative: If the table structure is different, try this version:
-- INSERT INTO payment_providers (name, type) VALUES
-- ('Cash', 'cash'),
-- ('Card', 'card'),
-- ('M-Pesa', 'mobile_money'),
-- ('CRDB', 'bank_transfer')
-- ON CONFLICT (name) DO NOTHING;

-- If you need to add the provider_code column later, use:
-- ALTER TABLE payment_providers ADD COLUMN IF NOT EXISTS provider_code VARCHAR(20);
-- UPDATE payment_providers SET provider_code = UPPER(name) WHERE provider_code IS NULL;
