-- Fix points_transactions table structure
-- Migration: 20250131000061_fix_points_transactions_table_structure.sql
-- This migration fixes the incomplete points_transactions table structure

-- Drop the existing incomplete table
DROP TABLE IF EXISTS points_transactions CASCADE;

-- Create points_transactions table with correct structure
-- Note: device_id is made optional and won't reference devices table to avoid dependency issues
CREATE TABLE points_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjusted', 'redeemed', 'expired')),
    reason TEXT NOT NULL,
    device_id UUID, -- Made optional without foreign key constraint to avoid dependency issues
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_points_transactions_customer_id ON points_transactions(customer_id);
CREATE INDEX idx_points_transactions_transaction_type ON points_transactions(transaction_type);
CREATE INDEX idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX idx_points_transactions_device_id ON points_transactions(device_id);

-- Enable Row Level Security
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Authenticated users can view all points transactions
CREATE POLICY "Authenticated users can view points transactions" ON points_transactions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert points transactions
CREATE POLICY "Authenticated users can insert points transactions" ON points_transactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update points transactions (for corrections)
CREATE POLICY "Authenticated users can update points transactions" ON points_transactions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON points_transactions TO authenticated;
GRANT ALL ON points_transactions TO anon;

-- Add comments to table and columns
COMMENT ON TABLE points_transactions IS 'Tracks all customer loyalty points transactions including earned, spent, adjusted, redeemed, and expired points';
COMMENT ON COLUMN points_transactions.points_change IS 'Positive for earned points, negative for spent/redeemed points';
COMMENT ON COLUMN points_transactions.transaction_type IS 'Type of transaction: earned, spent, adjusted, redeemed, expired';
COMMENT ON COLUMN points_transactions.metadata IS 'Additional transaction metadata like order_id, previous_points, etc.';
