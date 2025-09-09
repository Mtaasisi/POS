-- Remove default 'Tanzania' from country columns to allow any country
-- This migration allows offices to be added in any country

-- Remove default from lats_shipping_agents country column
ALTER TABLE lats_shipping_agents ALTER COLUMN country DROP DEFAULT;

-- Remove default from lats_shipping_agent_offices country column  
ALTER TABLE lats_shipping_agent_offices ALTER COLUMN country DROP DEFAULT;

-- Add comment for documentation
COMMENT ON COLUMN lats_shipping_agents.country IS 'Country where the shipping agent operates - can be any country';
COMMENT ON COLUMN lats_shipping_agent_offices.country IS 'Country where the office is located - can be any country';
