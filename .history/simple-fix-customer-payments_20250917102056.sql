-- Simple fix for customer_payments table
-- Add missing columns without complex triggers

-- Add updated_at column if it doesn't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_by column if it doesn't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for updated_by column
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);

-- Update existing records to set updated_at to created_at if it's NULL
UPDATE customer_payments 
SET updated_at = created_at 
WHERE updated_at IS NULL;
