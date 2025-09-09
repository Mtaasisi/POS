-- Migration: Fix product view brand reference
-- This migration fixes the product_comprehensive_info view that references the removed brands table

-- Drop the existing view that references the removed brands table
DROP VIEW IF EXISTS product_comprehensive_info;

-- Recreate the view without the brand reference and removed barcode column
CREATE OR REPLACE VIEW product_comprehensive_info AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.specification,
    p.sku,
    p.cost_price,
    p.selling_price,
    p.stock_quantity,
    p.min_stock_level,
    p.condition,
    p.attributes,
    p.metadata,
    p.images,
    p.tags,
    p.is_active,
    p.total_quantity,
    p.total_value,
    c.name as category_name,
    s.name as supplier_name,
    sr.name as storage_room_name,
    ss.name as shelf_name,
    p.created_at,
    p.updated_at
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_suppliers s ON p.supplier_id = s.id
LEFT JOIN lats_storage_rooms sr ON p.storage_room_id = sr.id
LEFT JOIN lats_store_shelves ss ON p.store_shelf_id = ss.id;

-- Grant permissions on the view
GRANT SELECT ON product_comprehensive_info TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW product_comprehensive_info IS 'Comprehensive product information view - updated to remove brand references';
