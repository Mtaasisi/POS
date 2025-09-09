-- Remove email column from lats_shipping_agent_offices table
-- This migration removes the email field from office locations as requested

-- Drop the email column from shipping agent offices table
ALTER TABLE lats_shipping_agent_offices DROP COLUMN IF EXISTS email;

-- Add comment for documentation
COMMENT ON TABLE lats_shipping_agent_offices IS 'Shipping agent offices table - email field removed';
