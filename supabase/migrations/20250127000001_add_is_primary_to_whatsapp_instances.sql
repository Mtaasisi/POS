-- Add is_primary column to whatsapp_instances_comprehensive table
-- This fixes the 400 Bad Request errors when querying with is_primary filter

-- Add the is_primary column if it doesn't exist
ALTER TABLE whatsapp_instances_comprehensive 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_is_primary 
ON whatsapp_instances_comprehensive(is_primary);

-- Create trigger to ensure only one primary instance per user
CREATE OR REPLACE FUNCTION ensure_single_primary_whatsapp_instance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        -- Set all other instances for this user to non-primary
        UPDATE whatsapp_instances_comprehensive 
        SET is_primary = false 
        WHERE user_id = NEW.user_id 
        AND instance_id != NEW.instance_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_whatsapp_instance 
ON whatsapp_instances_comprehensive;

CREATE TRIGGER trigger_ensure_single_primary_whatsapp_instance
    BEFORE UPDATE OR INSERT ON whatsapp_instances_comprehensive
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_whatsapp_instance();

-- Set the first active instance for each user as primary (if none exists)
WITH first_active_instances AS (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        instance_id
    FROM whatsapp_instances_comprehensive 
    WHERE is_active = true
    ORDER BY user_id, created_at ASC
)
UPDATE whatsapp_instances_comprehensive 
SET is_primary = true
FROM first_active_instances 
WHERE whatsapp_instances_comprehensive.user_id = first_active_instances.user_id
  AND whatsapp_instances_comprehensive.instance_id = first_active_instances.instance_id
  AND NOT EXISTS (
      SELECT 1 FROM whatsapp_instances_comprehensive wic2 
      WHERE wic2.user_id = whatsapp_instances_comprehensive.user_id 
      AND wic2.is_primary = true
  );
