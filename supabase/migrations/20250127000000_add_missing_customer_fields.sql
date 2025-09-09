-- Migration: Add missing customer fields
-- This migration adds the total_returns and profile_image fields that are referenced
-- in the application but missing from the database schema

-- Add total_returns field if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0;

-- Add profile_image field if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_total_returns ON customers(total_returns);
CREATE INDEX IF NOT EXISTS idx_customers_profile_image ON customers(profile_image);

-- Update existing records to have default values
UPDATE customers 
SET 
    total_returns = COALESCE(total_returns, 0),
    profile_image = COALESCE(profile_image, NULL)
WHERE total_returns IS NULL OR profile_image IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN ('total_returns', 'profile_image');
