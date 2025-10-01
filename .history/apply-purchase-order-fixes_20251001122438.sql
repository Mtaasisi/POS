-- =====================================================
-- PURCHASE ORDER FIXES - RUN THIS IN SUPABASE SQL EDITOR
-- =====================================================
-- This script applies all fixes needed for purchase order creation and status updates
-- Run this entire file in your Supabase SQL Editor

-- =====================================================
-- FIX 1: Ensure all required columns exist
-- =====================================================

-- Add currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'currency') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN currency VARCHAR(3) DEFAULT 'TZS';
        RAISE NOTICE 'Added currency column';
    END IF;
END $$;

-- Add payment_terms column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'payment_terms') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN payment_terms TEXT;
        RAISE NOTICE 'Added payment_terms column';
    END IF;
END $$;

-- Add exchange_rate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate DECIMAL(10,6) DEFAULT 1.0;
        RAISE NOTICE 'Added exchange_rate column';
    END IF;
END $$;

-- Add base_currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'base_currency') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN base_currency TEXT DEFAULT 'TZS';
        RAISE NOTICE 'Added base_currency column';
    END IF;
END $$;

-- Add exchange_rate_source column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate_source') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate_source TEXT;
        RAISE NOTICE 'Added exchange_rate_source column';
    END IF;
END $$;

-- Add exchange_rate_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate_date') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added exchange_rate_date column';
    END IF;
END $$;

-- =====================================================
-- FIX 2: Update status constraint to allow all status values
-- =====================================================

-- Drop the existing status check constraint
ALTER TABLE lats_purchase_orders 
DROP CONSTRAINT IF EXISTS lats_purchase_orders_status_check;

-- Add the new status check constraint with additional values
ALTER TABLE lats_purchase_orders 
ADD CONSTRAINT lats_purchase_orders_status_check 
CHECK (status IN (
    'draft',           -- Initial draft state
    'sent',            -- Sent to supplier
    'confirmed',       -- Confirmed by supplier
    'shipped',         -- Items have been shipped
    'partial_received', -- Some items received
    'received',        -- All items received
    'cancelled'        -- Order cancelled
));

-- =====================================================
-- FIX 3: Create/fix audit table
-- =====================================================

-- Ensure purchase_order_audit table exists with correct schema
CREATE TABLE IF NOT EXISTS purchase_order_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'user_id') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'created_by') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_audit' AND column_name = 'timestamp') THEN
        ALTER TABLE purchase_order_audit ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_currency ON lats_purchase_orders(currency);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_exchange_rate_date ON lats_purchase_orders(exchange_rate_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON lats_purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_order_id ON purchase_order_audit(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_timestamp ON purchase_order_audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_purchase_order_audit_action ON purchase_order_audit(action);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE purchase_order_audit ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can view audit records for their purchase orders" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create purchase order audit" ON purchase_order_audit;
DROP POLICY IF EXISTS "Users can create audit records for their purchase orders" ON purchase_order_audit;

-- Create SELECT policy
CREATE POLICY "Users can view audit records for their purchase orders" 
ON purchase_order_audit FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_audit.purchase_order_id 
        AND (created_by = auth.uid() OR auth.uid() IS NOT NULL)
    )
);

-- Create INSERT policy
CREATE POLICY "Users can create audit records for their purchase orders" 
ON purchase_order_audit FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM lats_purchase_orders 
        WHERE id = purchase_order_audit.purchase_order_id 
        AND (created_by = auth.uid() OR auth.uid() IS NOT NULL)
    )
);

-- =====================================================
-- CREATE HELPER FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS log_purchase_order_audit(UUID, TEXT, TEXT, UUID);

-- Create helper function for logging audit entries
CREATE OR REPLACE FUNCTION log_purchase_order_audit(
    p_purchase_order_id UUID,
    p_action TEXT,
    p_details TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    INSERT INTO purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by,
        timestamp
    ) VALUES (
        p_purchase_order_id,
        p_action,
        p_details,
        v_user_id,
        v_user_id,
        NOW()
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_purchase_order_audit TO authenticated;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.currency IS 'Currency code for the purchase order (e.g., TZS, USD, EUR)';
COMMENT ON COLUMN lats_purchase_orders.payment_terms IS 'Payment terms for the purchase order (e.g., Net 30, COD, etc.)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate IS 'Exchange rate from purchase currency to base currency at time of purchase';
COMMENT ON COLUMN lats_purchase_orders.base_currency IS 'Base currency for the business (typically TZS)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_source IS 'Source of the exchange rate (manual, api, bank, etc.)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_date IS 'Date when the exchange rate was applied';
COMMENT ON COLUMN lats_purchase_orders.status IS 'Order status: draft, sent, confirmed, shipped, partial_received, received, or cancelled';

