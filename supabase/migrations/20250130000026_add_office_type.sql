-- Add office_type column to lats_shipping_agent_offices table
-- This migration adds support for different office types (warehouse, office, branch, headquarters)

-- Add the office_type column to the shipping agent offices table
ALTER TABLE lats_shipping_agent_offices 
ADD COLUMN IF NOT EXISTS office_type TEXT DEFAULT 'office' CHECK (office_type IN ('office', 'warehouse', 'branch', 'headquarters'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shipping_agent_offices_type ON lats_shipping_agent_offices(office_type);

-- Add comment for documentation
COMMENT ON COLUMN lats_shipping_agent_offices.office_type IS 'Type of office: office, warehouse, branch, or headquarters';

