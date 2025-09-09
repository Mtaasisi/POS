-- Remove email column from lats_shipping_agents table
-- This migration removes the email field from main shipping agents as requested

-- Drop the email column from shipping agents table
ALTER TABLE lats_shipping_agents DROP COLUMN IF EXISTS email;

-- Drop the email index if it exists
DROP INDEX IF EXISTS idx_shipping_agents_email;

-- Add comment for documentation
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table - email field removed';
