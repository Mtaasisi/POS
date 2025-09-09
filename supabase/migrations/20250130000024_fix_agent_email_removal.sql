-- Fix agent email removal by updating the view first
-- This migration removes email from the view and then drops the column

-- 1. First, drop the existing view that depends on the email column
DROP VIEW IF EXISTS lats_shipping_agents_with_offices;

-- 2. Now drop the email column from the table
ALTER TABLE lats_shipping_agents DROP COLUMN IF EXISTS email;

-- 3. Drop the email index if it exists
DROP INDEX IF EXISTS idx_shipping_agents_email;

-- 4. Recreate the view without the email column
CREATE VIEW lats_shipping_agents_with_offices AS
SELECT 
    sa.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', o.id,
                'name', o.name,
                'address', o.address,
                'city', o.city,
                'country', o.country,
                'phone', o.phone,
                'coordinates', o.coordinates,
                'isPrimary', o.is_primary
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
    ) as offices
FROM lats_shipping_agents sa
LEFT JOIN lats_shipping_agent_offices o ON sa.id = o.agent_id
GROUP BY sa.id;

-- 5. Grant permissions on the view
GRANT SELECT ON lats_shipping_agents_with_offices TO authenticated;

-- 6. Add comment for documentation
COMMENT ON VIEW lats_shipping_agents_with_offices IS 'View combining shipping agents with their offices - email field removed';
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents table - email field removed';
