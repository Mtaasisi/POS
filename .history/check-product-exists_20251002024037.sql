-- Check if product exists in the database
SELECT 
    'Product Check' as check_type,
    p.id,
    p.name,
    p.description,
    p.is_active,
    p.total_quantity,
    p.created_at,
    p.updated_at,
    c.name as category_name,
    s.name as supplier_name
FROM lats_products p
LEFT JOIN lats_categories c ON p.category_id = c.id
LEFT JOIN lats_suppliers s ON p.supplier_id = s.id
WHERE p.id = '7f9b4123-e39c-4d71-8672-2a2c069d7eb0';

-- Check product variants
SELECT 
    'Product Variants Check' as check_type,
    pv.id,
    pv.product_id,
    pv.sku,
    pv.name,
    pv.quantity,
    pv.cost_price,
    pv.selling_price,
    pv.created_at
FROM lats_product_variants pv
WHERE pv.product_id = '7f9b4123-e39c-4d71-8672-2a2c069d7eb0';

-- Check stock movements for this product
SELECT 
    'Stock Movements Check' as check_type,
    sm.id,
    sm.product_id,
    sm.variant_id,
    sm.type,
    sm.quantity,
    sm.previous_quantity,
    sm.new_quantity,
    sm.reason,
    sm.created_at
FROM lats_stock_movements sm
WHERE sm.product_id = '7f9b4123-e39c-4d71-8672-2a2c069d7eb0'
ORDER BY sm.created_at DESC;

-- Check if product exists in any other tables
SELECT 'All Products with similar ID' as check_type, id, name FROM lats_products WHERE id::text LIKE '%7f9b4123%';

-- Check inventory items table
SELECT 
    'Inventory Items Check' as check_type,
    ii.id,
    ii.product_id,
    ii.serial_number,
    ii.status,
    ii.quantity,
    ii.cost_price,
    ii.created_at
FROM inventory_items ii
WHERE ii.product_id = '7f9b4123-e39c-4d71-8672-2a2c069d7eb0';
