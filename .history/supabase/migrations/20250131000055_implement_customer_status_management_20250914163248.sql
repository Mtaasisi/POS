-- Migration: 20250131000055_implement_customer_status_management.sql
-- Implement automatic customer status management based on activity

-- First, ensure customers table has the necessary columns
-- Add last_activity_date if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' 
        AND column_name = 'last_activity_date'
    ) THEN
        ALTER TABLE customers ADD COLUMN last_activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create function to update customer activity
CREATE OR REPLACE FUNCTION update_customer_activity(customer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE customers 
    SET 
        last_activity_date = NOW(),
        is_active = true,
        last_visit = NOW(),
        updated_at = NOW()
    WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically deactivate inactive customers
CREATE OR REPLACE FUNCTION deactivate_inactive_customers()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE customers 
    SET 
        is_active = false,
        updated_at = NOW()
    WHERE 
        is_active = true 
        AND last_activity_date < NOW() - INTERVAL '2 months'
        AND created_at < NOW() - INTERVAL '2 months'; -- Only deactivate customers who have been created for at least 2 months
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get customer status with calculated values
CREATE OR REPLACE FUNCTION get_customer_status(customer_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    is_active BOOLEAN,
    member_since TEXT,
    last_visit TEXT,
    days_since_activity INTEGER,
    status_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.is_active,
        COALESCE(
            TO_CHAR(c.created_at, 'Mon DD, YYYY'),
            TO_CHAR(c.joined_date, 'Mon DD, YYYY'),
            'Unknown'
        ) as member_since,
        COALESCE(
            CASE 
                WHEN c.last_visit IS NOT NULL THEN TO_CHAR(c.last_visit, 'Mon DD, YYYY')
                WHEN c.last_activity_date IS NOT NULL THEN TO_CHAR(c.last_activity_date, 'Mon DD, YYYY')
                WHEN c.updated_at IS NOT NULL THEN TO_CHAR(c.updated_at, 'Mon DD, YYYY')
                ELSE 'Never'
            END,
            'Never'
        ) as last_visit,
        CASE 
            WHEN c.last_activity_date IS NOT NULL THEN 
                EXTRACT(DAY FROM (NOW() - c.last_activity_date))::INTEGER
            WHEN c.last_visit IS NOT NULL THEN 
                EXTRACT(DAY FROM (NOW() - c.last_visit))::INTEGER
            WHEN c.updated_at IS NOT NULL THEN 
                EXTRACT(DAY FROM (NOW() - c.updated_at))::INTEGER
            ELSE 
                EXTRACT(DAY FROM (NOW() - c.created_at))::INTEGER
        END as days_since_activity,
        CASE 
            WHEN c.is_active = false THEN 'Inactive - No activity for 2+ months'
            WHEN c.last_activity_date < NOW() - INTERVAL '1 month' THEN 'At Risk - No recent activity'
            WHEN c.last_activity_date < NOW() - INTERVAL '1 week' THEN 'Needs Attention - Low activity'
            ELSE 'Active - Recent activity'
        END as status_reason
    FROM customers c
    WHERE c.id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically update last_activity_date on customer updates
CREATE OR REPLACE FUNCTION update_customer_activity_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_activity_date when customer record is modified
    NEW.last_activity_date = NOW();
    NEW.updated_at = NOW();
    
    -- If customer is being updated and was inactive, reactivate them
    IF OLD.is_active = false AND NEW.is_active = true THEN
        NEW.last_visit = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update activity on customer record changes
DROP TRIGGER IF EXISTS trigger_update_customer_activity ON customers;
CREATE TRIGGER trigger_update_customer_activity
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_activity_on_change();

-- Create function to track customer activity from various sources
CREATE OR REPLACE FUNCTION track_customer_activity(
    customer_id UUID,
    activity_type TEXT DEFAULT 'general'
)
RETURNS VOID AS $$
BEGIN
    -- Update customer activity
    PERFORM update_customer_activity(customer_id);
    
    -- Log the activity (optional - can be used for analytics)
    INSERT INTO customer_activity_log (customer_id, activity_type, created_at)
    VALUES (customer_id, activity_type, NOW())
    ON CONFLICT DO NOTHING; -- Ignore if table doesn't exist
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, just update customer activity
        NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to get inactive customers
CREATE OR REPLACE FUNCTION get_inactive_customers()
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    days_inactive INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        c.last_activity_date,
        EXTRACT(DAY FROM (NOW() - COALESCE(c.last_activity_date, c.created_at)))::INTEGER as days_inactive,
        c.created_at
    FROM customers c
    WHERE 
        c.is_active = false 
        OR (c.is_active = true AND c.last_activity_date < NOW() - INTERVAL '2 months')
    ORDER BY c.last_activity_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Update existing customers to have proper activity dates
UPDATE customers 
SET last_activity_date = COALESCE(last_visit, updated_at, created_at)
WHERE last_activity_date IS NULL;

-- Set all existing customers to active initially (they will be deactivated by the function if needed)
UPDATE customers 
SET is_active = true 
WHERE is_active IS NULL;

-- Create index for better performance on activity queries
CREATE INDEX IF NOT EXISTS idx_customers_last_activity_date ON customers(last_activity_date);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- Add comment to document the new functionality
COMMENT ON FUNCTION update_customer_activity(UUID) IS 'Updates customer activity timestamp and reactivates customer';
COMMENT ON FUNCTION deactivate_inactive_customers() IS 'Automatically deactivates customers with no activity for 2+ months';
COMMENT ON FUNCTION get_customer_status(UUID) IS 'Returns comprehensive customer status information';
COMMENT ON FUNCTION track_customer_activity(UUID, TEXT) IS 'Tracks customer activity from various sources and updates status';
COMMENT ON FUNCTION get_inactive_customers() IS 'Returns list of inactive customers with inactivity duration';

