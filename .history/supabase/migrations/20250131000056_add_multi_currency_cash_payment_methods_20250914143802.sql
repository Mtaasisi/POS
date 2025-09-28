-- =====================================================
-- ADD MULTI-CURRENCY CASH PAYMENT METHODS
-- =====================================================
-- This migration adds cash payment methods for different currencies
-- to handle cases where cash payments are received in foreign currencies

-- Add additional cash payment methods for different currencies
INSERT INTO finance_accounts (id, name, type, balance, currency, is_active, is_payment_method, payment_icon, payment_color, payment_description, requires_reference, requires_account_number, notes) VALUES
-- USD Cash
('550e8400-e29b-41d4-a716-446655440007', 'Cash (USD)', 'cash', 0, 'USD', true, true, '💵', '#10B981', 'Cash payments in US Dollars', false, false, 'USD cash payment method for foreign currency transactions'),
-- EUR Cash  
('550e8400-e29b-41d4-a716-446655440008', 'Cash (EUR)', 'cash', 0, 'EUR', true, true, '💵', '#10B981', 'Cash payments in Euros', false, false, 'EUR cash payment method for foreign currency transactions'),
-- GBP Cash
('550e8400-e29b-41d4-a716-446655440009', 'Cash (GBP)', 'cash', 0, 'GBP', true, true, '💵', '#10B981', 'Cash payments in British Pounds', false, false, 'GBP cash payment method for foreign currency transactions'),
-- AED Cash
('550e8400-e29b-41d4-a716-446655440010', 'Cash (AED)', 'cash', 0, 'AED', true, true, '💵', '#10B981', 'Cash payments in UAE Dirhams', false, false, 'AED cash payment method for foreign currency transactions'),
-- KES Cash
('550e8400-e29b-41d4-a716-446655440011', 'Cash (KES)', 'cash', 0, 'KES', true, true, '💵', '#10B981', 'Cash payments in Kenyan Shillings', false, false, 'KES cash payment method for foreign currency transactions'),
-- CNY Cash
('550e8400-e29b-41d4-a716-446655440012', 'Cash (CNY)', 'cash', 0, 'CNY', true, true, '💵', '#10B981', 'Cash payments in Chinese Yuan', false, false, 'CNY cash payment method for foreign currency transactions')
ON CONFLICT (id) DO NOTHING;

-- Add corresponding payment methods entries
INSERT INTO payment_methods (name, type, account_id, currency, description) VALUES
('Cash Payment (USD)', 'cash', '550e8400-e29b-41d4-a716-446655440007', 'USD', 'Cash payment method in US Dollars'),
('Cash Payment (EUR)', 'cash', '550e8400-e29b-41d4-a716-446655440008', 'EUR', 'Cash payment method in Euros'),
('Cash Payment (GBP)', 'cash', '550e8400-e29b-41d4-a716-446655440009', 'GBP', 'Cash payment method in British Pounds'),
('Cash Payment (AED)', 'cash', '550e8400-e29b-41d4-a716-446655440010', 'AED', 'Cash payment method in UAE Dirhams'),
('Cash Payment (KES)', 'cash', '550e8400-e29b-41d4-a716-446655440011', 'KES', 'Cash payment method in Kenyan Shillings'),
('Cash Payment (CNY)', 'cash', '550e8400-e29b-41d4-a716-446655440012', 'CNY', 'Cash payment method in Chinese Yuan')
ON CONFLICT DO NOTHING;

-- Update the original cash payment method to be more specific
UPDATE finance_accounts 
SET name = 'Cash (TZS)', 
    payment_description = 'Cash payments in Tanzanian Shillings',
    notes = 'TZS cash payment method for local currency transactions'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE payment_methods 
SET name = 'Cash Payment (TZS)', 
    description = 'Cash payment method in Tanzanian Shillings'
WHERE account_id = '550e8400-e29b-41d4-a716-446655440001';

-- Add comments for documentation
COMMENT ON TABLE finance_accounts IS 'Finance accounts including multi-currency cash payment methods';
COMMENT ON TABLE payment_methods IS 'Payment methods including multi-currency cash options';
