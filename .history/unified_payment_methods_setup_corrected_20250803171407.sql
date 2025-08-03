-- Unified Payment Methods Setup - CORRECTED VERSION
-- This connects POS and Finance Management payment methods

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Unified Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'card', 'transfer', 'mobile_money', 'check', 'installment', 'delivery')),
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Payment Method Accounts Mapping Table
CREATE TABLE IF NOT EXISTS payment_method_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE CASCADE,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_method_id, account_id)
);

-- 3. Insert Default Payment Methods
INSERT INTO payment_methods (name, code, type, icon, color, description) VALUES
-- Cash Methods
('Cash', 'cash', 'cash', 'dollar-sign', '#10B981', 'Physical cash payments'),
('Cash on Delivery', 'cash_on_delivery', 'cash', 'truck', '#F59E0B', 'Cash payment upon delivery'),

-- Card Methods
('Credit Card', 'credit_card', 'card', 'credit-card', '#3B82F6', 'Credit card payments'),
('Debit Card', 'debit_card', 'card', 'credit-card', '#8B5CF6', 'Debit card payments'),
('Card Payment', 'card', 'card', 'credit-card', '#6366F1', 'Generic card payment'),

-- Transfer Methods
('Bank Transfer', 'bank_transfer', 'transfer', 'building', '#059669', 'Direct bank transfers'),
('Mobile Money', 'mobile_money', 'mobile_money', 'smartphone', '#DC2626', 'Mobile money payments'),
('Wire Transfer', 'wire_transfer', 'transfer', 'globe', '#7C3AED', 'International wire transfers'),

-- Check Methods
('Check', 'check', 'check', 'file-text', '#F97316', 'Check payments'),
('Postdated Check', 'postdated_check', 'check', 'calendar', '#EF4444', 'Postdated check payments'),

-- Installment Methods
('Installment Payment', 'installment', 'installment', 'calendar', '#8B5CF6', 'Payment in installments'),
('Monthly Installment', 'monthly_installment', 'installment', 'calendar', '#EC4899', 'Monthly installment payments'),

-- Delivery Methods
('Payment on Delivery', 'payment_on_delivery', 'delivery', 'truck', '#F59E0B', 'Payment upon delivery'),
('Pickup Payment', 'pickup_payment', 'delivery', 'package', '#10B981', 'Payment upon pickup')
ON CONFLICT (code) DO NOTHING;

-- 4. Update POS sales_orders table to reference payment_methods
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- 5. Update finance_expenses table to reference payment_methods
ALTER TABLE finance_expenses 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- 6. Update installment_payments table to reference payment_methods
ALTER TABLE installment_payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id);

-- 7. Create function to get payment method by code
CREATE OR REPLACE FUNCTION get_payment_method_by_code(payment_code VARCHAR(50))
RETURNS UUID AS $$
DECLARE
    method_id UUID;
BEGIN
    SELECT id INTO method_id 
    FROM payment_methods 
    WHERE code = payment_code AND is_active = true;
    
    RETURN method_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to migrate existing payment methods
CREATE OR REPLACE FUNCTION migrate_existing_payment_methods()
RETURNS VOID AS $$
BEGIN
    -- Migrate POS sales_orders payment_method to payment_method_id
    UPDATE sales_orders 
    SET payment_method_id = get_payment_method_by_code(payment_method)
    WHERE payment_method_id IS NULL AND payment_method IS NOT NULL;
    
    -- Migrate finance_expenses payment_method to payment_method_id
    UPDATE finance_expenses 
    SET payment_method_id = get_payment_method_by_code(payment_method)
    WHERE payment_method_id IS NULL AND payment_method IS NOT NULL;
    
    -- Migrate installment_payments payment_method to payment_method_id
    UPDATE installment_payments 
    SET payment_method_id = get_payment_method_by_code(payment_method)
    WHERE payment_method_id IS NULL AND payment_method IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Create function to get payment method details
CREATE OR REPLACE FUNCTION get_payment_method_details(method_id UUID)
RETURNS TABLE(
    id UUID,
    name VARCHAR(100),
    code VARCHAR(50),
    type VARCHAR(50),
    icon VARCHAR(50),
    color VARCHAR(7),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.name,
        pm.code,
        pm.type,
        pm.icon,
        pm.color,
        pm.description
    FROM payment_methods pm
    WHERE pm.id = method_id AND pm.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 10. Create function to get all active payment methods
CREATE OR REPLACE FUNCTION get_active_payment_methods()
RETURNS TABLE(
    id UUID,
    name VARCHAR(100),
    code VARCHAR(50),
    type VARCHAR(50),
    icon VARCHAR(50),
    color VARCHAR(7),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.id,
        pm.name,
        pm.code,
        pm.type,
        pm.icon,
        pm.color,
        pm.description
    FROM payment_methods pm
    WHERE pm.is_active = true
    ORDER BY pm.name;
END;
$$ LANGUAGE plpgsql;

-- 11. Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_accounts ENABLE ROW LEVEL SECURITY;

-- 12. Create RLS policies
CREATE POLICY "Users can view payment methods" ON payment_methods 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment method accounts" ON payment_method_accounts 
FOR SELECT USING (auth.role() = 'authenticated');

-- 13. Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_method_accounts_method_id ON payment_method_accounts(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_method_accounts_account_id ON payment_method_accounts(account_id);

-- 14. Create trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at 
BEFORE UPDATE ON payment_methods 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. Run migration function
SELECT migrate_existing_payment_methods();

-- 16. Add comments
COMMENT ON TABLE payment_methods IS 'Unified payment methods used across POS and Finance systems';
COMMENT ON TABLE payment_method_accounts IS 'Mapping between payment methods and finance accounts';
COMMENT ON FUNCTION get_payment_method_by_code IS 'Get payment method ID by code';
COMMENT ON FUNCTION migrate_existing_payment_methods IS 'Migrate existing payment methods to new unified system';
COMMENT ON FUNCTION get_payment_method_details IS 'Get detailed payment method information';
COMMENT ON FUNCTION get_active_payment_methods IS 'Get all active payment methods'; 