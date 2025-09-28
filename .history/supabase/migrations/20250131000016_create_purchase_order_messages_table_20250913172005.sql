-- Create purchase_order_messages table for PO communication
-- Migration: 20250131000016_create_purchase_order_messages_table.sql

-- Purchase order messages table
CREATE TABLE IF NOT EXISTS purchase_order_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'user', 'supplier')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_order_id ON purchase_order_messages(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_timestamp ON purchase_order_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_messages_type ON purchase_order_messages(type);

-- RLS Policies
ALTER TABLE purchase_order_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages for their purchase orders
CREATE POLICY "Users can view purchase order messages" ON purchase_order_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_messages.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can create messages for their purchase orders
CREATE POLICY "Users can create purchase order messages" ON purchase_order_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_messages.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can update messages for their purchase orders
CREATE POLICY "Users can update purchase order messages" ON purchase_order_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_messages.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );

-- Users can delete messages for their purchase orders
CREATE POLICY "Users can delete purchase order messages" ON purchase_order_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM lats_purchase_orders po
            WHERE po.id = purchase_order_messages.purchase_order_id
            AND po.created_by = auth.uid()
        )
    );
