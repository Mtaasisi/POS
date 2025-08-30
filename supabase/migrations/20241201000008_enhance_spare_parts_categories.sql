-- Migration: 20241201000008_enhance_spare_parts_categories.sql
-- Enhance spare parts with better category integration and device compatibility

-- Add device compatibility table for spare parts
CREATE TABLE IF NOT EXISTS lats_device_compatibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
    device_brand TEXT NOT NULL,
    device_model TEXT NOT NULL,
    device_type TEXT NOT NULL, -- 'laptop', 'mobile', 'tablet', 'tv', 'soundbar', etc.
    compatibility_notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(spare_part_id, device_brand, device_model, device_type)
);

-- Add index for device compatibility lookups
CREATE INDEX IF NOT EXISTS idx_device_compatibility_lookup 
ON lats_device_compatibility(device_brand, device_model, device_type);

-- Add index for spare part compatibility
CREATE INDEX IF NOT EXISTS idx_device_compatibility_spare_part 
ON lats_device_compatibility(spare_part_id);

-- Add spare part type field to better categorize parts
ALTER TABLE lats_spare_parts 
ADD COLUMN IF NOT EXISTS part_type TEXT DEFAULT 'general';

-- Add common spare part types as check constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_spare_part_type' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE lats_spare_parts 
        ADD CONSTRAINT check_spare_part_type 
        CHECK (part_type IN (
            'battery', 'screen', 'speaker', 'camera', 'microphone', 'charging_port', 
            'motherboard', 'keyboard', 'trackpad', 'fan', 'heatsink', 'ram', 'storage',
            'connector', 'cable', 'adapter', 'case', 'cover', 'stand', 'mount', 'other'
        ));
    END IF;
END $$;

-- Add device type field to spare parts
ALTER TABLE lats_spare_parts 
ADD COLUMN IF NOT EXISTS primary_device_type TEXT DEFAULT 'general';

-- Add device type constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_primary_device_type' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE lats_spare_parts 
        ADD CONSTRAINT check_primary_device_type 
        CHECK (primary_device_type IN (
            'laptop', 'mobile', 'tablet', 'tv', 'soundbar', 'speaker', 'headphone', 
            'camera', 'gaming', 'accessory', 'general'
        ));
    END IF;
END $$;

-- Add quick search tags for spare parts
ALTER TABLE lats_spare_parts 
ADD COLUMN IF NOT EXISTS search_tags TEXT[] DEFAULT '{}';

-- Add index for search tags
CREATE INDEX IF NOT EXISTS idx_spare_parts_search_tags 
ON lats_spare_parts USING GIN(search_tags);

-- Create function to get spare parts by device compatibility
CREATE OR REPLACE FUNCTION get_spare_parts_by_device(
    device_brand TEXT,
    device_model TEXT,
    device_type TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category_id UUID,
    part_number TEXT,
    part_type TEXT,
    primary_device_type TEXT,
    cost_price DECIMAL,
    selling_price DECIMAL,
    quantity INTEGER,
    min_quantity INTEGER,
    location TEXT,
    search_tags TEXT[],
    compatibility_notes TEXT,
    is_verified BOOLEAN,
    category_name TEXT,
    category_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.category_id,
        sp.part_number,
        sp.part_type,
        sp.primary_device_type,
        sp.cost_price,
        sp.selling_price,
        sp.quantity,
        sp.min_quantity,
        sp.location,
        sp.search_tags,
        dc.compatibility_notes,
        dc.is_verified,
        c.name as category_name,
        get_category_path(c.id) as category_path
    FROM lats_spare_parts sp
    LEFT JOIN lats_categories c ON sp.category_id = c.id
    INNER JOIN lats_device_compatibility dc ON sp.id = dc.spare_part_id
    WHERE dc.device_brand ILIKE device_brand
      AND dc.device_model ILIKE device_model
      AND dc.device_type = device_type
      AND sp.is_active = true
    ORDER BY sp.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get spare parts by part type
CREATE OR REPLACE FUNCTION get_spare_parts_by_type(
    part_type TEXT,
    device_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category_id UUID,
    part_number TEXT,
    primary_device_type TEXT,
    cost_price DECIMAL,
    selling_price DECIMAL,
    quantity INTEGER,
    min_quantity INTEGER,
    location TEXT,
    search_tags TEXT[],
    category_name TEXT,
    category_path TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.category_id,
        sp.part_number,
        sp.primary_device_type,
        sp.cost_price,
        sp.selling_price,
        sp.quantity,
        sp.min_quantity,
        sp.location,
        sp.search_tags,
        c.name as category_name,
        get_category_path(c.id) as category_path
    FROM lats_spare_parts sp
    LEFT JOIN lats_categories c ON sp.category_id = c.id
    WHERE sp.part_type = part_type
      AND (device_type IS NULL OR sp.primary_device_type = device_type)
      AND sp.is_active = true
    ORDER BY sp.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to search spare parts by tags
CREATE OR REPLACE FUNCTION search_spare_parts_by_tags(
    search_tags TEXT[]
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category_id UUID,
    part_number TEXT,
    part_type TEXT,
    primary_device_type TEXT,
    cost_price DECIMAL,
    selling_price DECIMAL,
    quantity INTEGER,
    min_quantity INTEGER,
    location TEXT,
    search_tags TEXT[],
    category_name TEXT,
    category_path TEXT,
    match_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.description,
        sp.category_id,
        sp.part_number,
        sp.part_type,
        sp.primary_device_type,
        sp.cost_price,
        sp.selling_price,
        sp.quantity,
        sp.min_quantity,
        sp.location,
        sp.search_tags,
        c.name as category_name,
        get_category_path(c.id) as category_path,
        array_length(array(
            SELECT unnest(sp.search_tags) 
            INTERSECT 
            SELECT unnest(search_tags)
        ), 1) as match_score
    FROM lats_spare_parts sp
    LEFT JOIN lats_categories c ON sp.category_id = c.id
    WHERE sp.search_tags && search_tags
      AND sp.is_active = true
    ORDER BY match_score DESC, sp.name;
END;
$$ LANGUAGE plpgsql;

-- Create function to get spare parts statistics by category
CREATE OR REPLACE FUNCTION get_spare_parts_category_stats()
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_path TEXT,
    total_parts INTEGER,
    total_value DECIMAL,
    low_stock_parts INTEGER,
    out_of_stock_parts INTEGER,
    part_types TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        get_category_path(c.id) as category_path,
        COUNT(sp.id) as total_parts,
        COALESCE(SUM(sp.selling_price * sp.quantity), 0) as total_value,
        COUNT(CASE WHEN sp.quantity > 0 AND sp.quantity <= sp.min_quantity THEN 1 END) as low_stock_parts,
        COUNT(CASE WHEN sp.quantity = 0 THEN 1 END) as out_of_stock_parts,
        array_agg(DISTINCT sp.part_type) as part_types
    FROM lats_categories c
    LEFT JOIN lats_spare_parts sp ON c.id = sp.category_id AND sp.is_active = true
    WHERE c.is_active = true
    GROUP BY c.id, c.name
    ORDER BY category_path;
END;
$$ LANGUAGE plpgsql;

-- Create view for spare parts with category hierarchy
CREATE OR REPLACE VIEW spare_parts_with_categories AS
SELECT 
    sp.id,
    sp.name,
    sp.description,
    sp.category_id,
    sp.part_number,
    sp.part_type,
    sp.primary_device_type,
    sp.cost_price,
    sp.selling_price,
    sp.quantity,
    sp.min_quantity,
    sp.location,
    sp.search_tags,
    sp.is_active,
    sp.created_at,
    sp.updated_at,
    c.name as category_name,
    get_category_path(c.id) as category_path,
    get_category_depth(c.id) as category_depth,
    CASE 
        WHEN sp.quantity = 0 THEN 'out_of_stock'
        WHEN sp.quantity <= sp.min_quantity THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM lats_spare_parts sp
LEFT JOIN lats_categories c ON sp.category_id = c.id
WHERE sp.is_active = true;

-- Create function to add device compatibility
CREATE OR REPLACE FUNCTION add_device_compatibility(
    spare_part_id UUID,
    device_brand TEXT,
    device_model TEXT,
    device_type TEXT,
    compatibility_notes TEXT DEFAULT NULL,
    is_verified BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    compatibility_id UUID;
BEGIN
    INSERT INTO lats_device_compatibility (
        spare_part_id,
        device_brand,
        device_model,
        device_type,
        compatibility_notes,
        is_verified
    ) VALUES (
        spare_part_id,
        device_brand,
        device_model,
        device_type,
        compatibility_notes,
        is_verified
    ) ON CONFLICT (spare_part_id, device_brand, device_model, device_type) 
    DO UPDATE SET
        compatibility_notes = EXCLUDED.compatibility_notes,
        is_verified = EXCLUDED.is_verified,
        updated_at = NOW()
    RETURNING id INTO compatibility_id;
    
    RETURN compatibility_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to bulk add device compatibility
CREATE OR REPLACE FUNCTION bulk_add_device_compatibility(
    spare_part_id UUID,
    device_list JSON
)
RETURNS INTEGER AS $$
DECLARE
    device JSON;
    added_count INTEGER := 0;
BEGIN
    FOR device IN SELECT * FROM json_array_elements(device_list)
    LOOP
        PERFORM add_device_compatibility(
            spare_part_id,
            (device->>'brand')::TEXT,
            (device->>'model')::TEXT,
            (device->>'type')::TEXT,
            (device->>'notes')::TEXT,
            COALESCE((device->>'verified')::BOOLEAN, false)
        );
        added_count := added_count + 1;
    END LOOP;
    
    RETURN added_count;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_type ON lats_spare_parts(part_type);
CREATE INDEX IF NOT EXISTS idx_spare_parts_device_type ON lats_spare_parts(primary_device_type);
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock_status ON lats_spare_parts(quantity, min_quantity);

-- Add RLS policies for device compatibility
CREATE POLICY "Users can view device compatibility" 
ON lats_device_compatibility FOR SELECT 
USING (true);

CREATE POLICY "Users can manage device compatibility" 
ON lats_device_compatibility FOR ALL 
USING (true);

-- Add comments
COMMENT ON TABLE lats_device_compatibility IS 'Device compatibility mapping for spare parts';
COMMENT ON COLUMN lats_spare_parts.part_type IS 'Type of spare part (battery, screen, speaker, etc.)';
COMMENT ON COLUMN lats_spare_parts.primary_device_type IS 'Primary device type this part is designed for';
COMMENT ON COLUMN lats_spare_parts.search_tags IS 'Array of search tags for quick lookup';

COMMENT ON FUNCTION get_spare_parts_by_device(TEXT, TEXT, TEXT) IS 'Get spare parts compatible with specific device';
COMMENT ON FUNCTION get_spare_parts_by_type(TEXT, TEXT) IS 'Get spare parts by part type and optionally device type';
COMMENT ON FUNCTION search_spare_parts_by_tags(TEXT[]) IS 'Search spare parts by matching tags';
COMMENT ON FUNCTION get_spare_parts_category_stats() IS 'Get statistics for spare parts by category';
COMMENT ON FUNCTION add_device_compatibility(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) IS 'Add device compatibility for a spare part';
COMMENT ON FUNCTION bulk_add_device_compatibility(UUID, JSON) IS 'Bulk add device compatibility from JSON array';
