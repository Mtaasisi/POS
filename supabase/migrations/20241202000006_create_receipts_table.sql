-- Create receipts table for storing sale receipts
CREATE TABLE IF NOT EXISTS lats_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES lats_sales(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL UNIQUE,
    customer_name TEXT,
    customer_phone TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method TEXT NOT NULL,
    items_count INTEGER NOT NULL DEFAULT 0,
    generated_by TEXT NOT NULL,
    receipt_content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_receipts_sale_id ON lats_receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_receipt_number ON lats_receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_lats_receipts_created_at ON lats_receipts(created_at);

-- Add RLS policies
ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own receipts
CREATE POLICY "Users can view receipts for their sales" ON lats_receipts
    FOR SELECT USING (
        sale_id IN (
            SELECT id FROM lats_sales 
            WHERE created_by = auth.uid()
        )
    );

-- Policy for users to create receipts for their sales
CREATE POLICY "Users can create receipts for their sales" ON lats_receipts
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT id FROM lats_sales 
            WHERE created_by = auth.uid()
        )
    );

-- Policy for users to update their own receipts
CREATE POLICY "Users can update their own receipts" ON lats_receipts
    FOR UPDATE USING (
        sale_id IN (
            SELECT id FROM lats_sales 
            WHERE created_by = auth.uid()
        )
    );

-- Policy for users to delete their own receipts
CREATE POLICY "Users can delete their own receipts" ON lats_receipts
    FOR DELETE USING (
        sale_id IN (
            SELECT id FROM lats_sales 
            WHERE created_by = auth.uid()
        )
    );

-- Add cost_price and profit columns to sale_items if they don't exist
DO $$ 
BEGIN
    -- Add cost_price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_sale_items' AND column_name = 'cost_price') THEN
        ALTER TABLE lats_sale_items ADD COLUMN cost_price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add profit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_sale_items' AND column_name = 'profit') THEN
        ALTER TABLE lats_sale_items ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;
