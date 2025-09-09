-- Migration: Update safe_create_product function to automatically create default variants
-- This ensures that all products created through the database function have variants

-- Drop the existing function
DROP FUNCTION IF EXISTS safe_create_product;

-- Create updated function with automatic default variant creation
CREATE OR REPLACE FUNCTION safe_create_product(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_specification TEXT DEFAULT NULL,
    p_sku TEXT DEFAULT NULL,
    p_cost_price DECIMAL(10,2) DEFAULT 0,
    p_selling_price DECIMAL(10,2) DEFAULT 0,
    p_stock_quantity INTEGER DEFAULT 0,
    p_min_stock_level INTEGER DEFAULT 0,
    p_condition TEXT DEFAULT 'new',
    p_category_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_storage_room_id UUID DEFAULT NULL,
    p_store_shelf_id UUID DEFAULT NULL,
    p_attributes JSONB DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}',
    p_images TEXT[] DEFAULT '{}',
    p_tags TEXT[] DEFAULT '{}'
) RETURNS TABLE(
    success BOOLEAN,
    product_id UUID,
    variant_id UUID,
    error_message TEXT
) AS $$
DECLARE
    new_product_id UUID;
    new_variant_id UUID;
    error_msg TEXT;
    default_sku TEXT;
BEGIN
    BEGIN
        -- Insert the product
        INSERT INTO lats_products (
            name, description, specification, sku,
            cost_price, selling_price, stock_quantity, min_stock_level,
            condition, category_id, supplier_id, storage_room_id, store_shelf_id,
            attributes, metadata, images, tags, is_active, total_quantity, total_value
        ) VALUES (
            p_name, p_description, p_specification, p_sku,
            p_cost_price, p_selling_price, p_stock_quantity, p_min_stock_level,
            p_condition, p_category_id, p_supplier_id, p_storage_room_id, p_store_shelf_id,
            p_attributes, p_metadata, p_images, p_tags, true, p_stock_quantity, (p_stock_quantity * p_cost_price)
        ) RETURNING id INTO new_product_id;
        
        -- Generate default SKU if not provided
        IF p_sku IS NULL OR p_sku = '' THEN
            default_sku := UPPER(REPLACE(REPLACE(p_name, ' ', ''), '-', '')) || '-DEFAULT-' || EXTRACT(EPOCH FROM NOW())::TEXT;
        ELSE
            default_sku := p_sku;
        END IF;
        
        -- Create default variant
        INSERT INTO lats_product_variants (
            product_id,
            sku,
            name,
            attributes,
            cost_price,
            selling_price,
            quantity,
            min_quantity,
            barcode,
            weight,
            dimensions,
            created_at,
            updated_at
        ) VALUES (
            new_product_id,
            default_sku,
            'Default',
            p_attributes,
            p_cost_price,
            p_selling_price,
            p_stock_quantity,
            p_min_stock_level,
            NULL,
            NULL,
            NULL,
            NOW(),
            NOW()
        ) RETURNING id INTO new_variant_id;
        
        -- Return success with both product and variant IDs
        RETURN QUERY SELECT true, new_product_id, new_variant_id, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION safe_create_product TO authenticated;

-- Add comment for the function
COMMENT ON FUNCTION safe_create_product IS 'Safely creates a product with automatic default variant creation';

-- Create a helper function to create products with variants
CREATE OR REPLACE FUNCTION create_product_with_variants(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_specification TEXT DEFAULT NULL,
    p_sku TEXT DEFAULT NULL,
    p_cost_price DECIMAL(10,2) DEFAULT 0,
    p_selling_price DECIMAL(10,2) DEFAULT 0,
    p_stock_quantity INTEGER DEFAULT 0,
    p_min_stock_level INTEGER DEFAULT 0,
    p_condition TEXT DEFAULT 'new',
    p_category_id UUID DEFAULT NULL,
    p_supplier_id UUID DEFAULT NULL,
    p_storage_room_id UUID DEFAULT NULL,
    p_store_shelf_id UUID DEFAULT NULL,
    p_attributes JSONB DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}',
    p_images TEXT[] DEFAULT '{}',
    p_tags TEXT[] DEFAULT '{}',
    p_variants JSONB DEFAULT '[]'::jsonb
) RETURNS TABLE(
    success BOOLEAN,
    product_id UUID,
    variant_ids UUID[],
    error_message TEXT
) AS $$
DECLARE
    new_product_id UUID;
    variant_ids UUID[] := '{}';
    variant_record RECORD;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Insert the product
        INSERT INTO lats_products (
            name, description, specification, sku,
            cost_price, selling_price, stock_quantity, min_stock_level,
            condition, category_id, supplier_id, storage_room_id, store_shelf_id,
            attributes, metadata, images, tags, is_active, total_quantity, total_value
        ) VALUES (
            p_name, p_description, p_specification, p_sku,
            p_cost_price, p_selling_price, p_stock_quantity, p_min_stock_level,
            p_condition, p_category_id, p_supplier_id, p_storage_room_id, p_store_shelf_id,
            p_attributes, p_metadata, p_images, p_tags, true, p_stock_quantity, (p_stock_quantity * p_cost_price)
        ) RETURNING id INTO new_product_id;
        
        -- If variants are provided, create them
        IF jsonb_array_length(p_variants) > 0 THEN
            FOR variant_record IN SELECT * FROM jsonb_to_recordset(p_variants) AS x(
                name TEXT,
                sku TEXT,
                cost_price DECIMAL(10,2),
                selling_price DECIMAL(10,2),
                quantity INTEGER,
                min_quantity INTEGER,
                attributes JSONB
            )
            LOOP
                INSERT INTO lats_product_variants (
                    product_id,
                    sku,
                    name,
                    attributes,
                    cost_price,
                    selling_price,
                    quantity,
                    min_quantity,
                    barcode,
                    weight,
                    dimensions,
                    created_at,
                    updated_at
                ) VALUES (
                    new_product_id,
                    variant_record.sku,
                    variant_record.name,
                    COALESCE(variant_record.attributes, '{}'),
                    COALESCE(variant_record.cost_price, 0),
                    COALESCE(variant_record.selling_price, 0),
                    COALESCE(variant_record.quantity, 0),
                    COALESCE(variant_record.min_quantity, 0),
                    NULL,
                    NULL,
                    NULL,
                    NOW(),
                    NOW()
                ) RETURNING id INTO variant_ids[array_length(variant_ids, 1) + 1];
            END LOOP;
        ELSE
            -- Create default variant if no variants provided
            INSERT INTO lats_product_variants (
                product_id,
                sku,
                name,
                attributes,
                cost_price,
                selling_price,
                quantity,
                min_quantity,
                barcode,
                weight,
                dimensions,
                created_at,
                updated_at
            ) VALUES (
                new_product_id,
                COALESCE(p_sku, UPPER(REPLACE(REPLACE(p_name, ' ', ''), '-', '')) || '-DEFAULT-' || EXTRACT(EPOCH FROM NOW())::TEXT),
                'Default',
                p_attributes,
                p_cost_price,
                p_selling_price,
                p_stock_quantity,
                p_min_stock_level,
                NULL,
                NULL,
                NULL,
                NOW(),
                NOW()
            ) RETURNING id INTO variant_ids[1];
        END IF;
        
        -- Return success with product and variant IDs
        RETURN QUERY SELECT true, new_product_id, variant_ids, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, NULL::UUID, '{}'::UUID[], error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_product_with_variants TO authenticated;

-- Add comment for the function
COMMENT ON FUNCTION create_product_with_variants IS 'Creates a product with specified variants or default variant if none provided';
