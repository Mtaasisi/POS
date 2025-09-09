-- Migration: Implement Draft Products Workflow
-- This migration implements the complete draft products workflow from PO to inventory

-- =====================================================
-- ADD PRODUCT STATUS TO LATS_PRODUCTS
-- =====================================================

-- Add status column to products table
ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('draft', 'active', 'inactive'));

-- Add comments for documentation
COMMENT ON COLUMN lats_products.status IS 'Product status: draft (from PO), active (in inventory), inactive (disabled)';

-- =====================================================
-- CREATE SHIPPING CARGO ITEMS TABLE
-- =====================================================

-- Create table to link draft products to shipping cargo items
CREATE TABLE IF NOT EXISTS lats_shipping_cargo_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipping_id UUID NOT NULL REFERENCES lats_shipping_info(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    purchase_order_item_id UUID REFERENCES lats_purchase_order_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    cost_price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shipping_id, product_id)
);

-- Add comments for documentation
COMMENT ON TABLE lats_shipping_cargo_items IS 'Links draft products to shipping cargo items for validation workflow';
COMMENT ON COLUMN lats_shipping_cargo_items.shipping_id IS 'Reference to shipping info';
COMMENT ON COLUMN lats_shipping_cargo_items.product_id IS 'Reference to draft product';
COMMENT ON COLUMN lats_shipping_cargo_items.purchase_order_item_id IS 'Reference to original PO item';
COMMENT ON COLUMN lats_shipping_cargo_items.quantity IS 'Quantity of this product in the shipment';

-- =====================================================
-- CREATE PRODUCT VALIDATION TRACKING TABLE
-- =====================================================

-- Create table to track product validation status
CREATE TABLE IF NOT EXISTS lats_product_validation (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    shipping_id UUID NOT NULL REFERENCES lats_shipping_info(id) ON DELETE CASCADE,
    is_validated BOOLEAN DEFAULT false,
    validation_errors JSONB DEFAULT '[]',
    validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, shipping_id)
);

-- Add comments for documentation
COMMENT ON TABLE lats_product_validation IS 'Tracks validation status of draft products before inventory';
COMMENT ON COLUMN lats_product_validation.is_validated IS 'Whether product has passed validation';
COMMENT ON COLUMN lats_product_validation.validation_errors IS 'JSON array of validation error messages';

-- =====================================================
-- UPDATE EXISTING PRODUCTS TO ACTIVE STATUS
-- =====================================================

-- Set all existing products to active status
UPDATE lats_products SET status = 'active' WHERE status IS NULL;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for shipping cargo items
CREATE INDEX IF NOT EXISTS idx_shipping_cargo_items_shipping_id ON lats_shipping_cargo_items(shipping_id);
CREATE INDEX IF NOT EXISTS idx_shipping_cargo_items_product_id ON lats_shipping_cargo_items(product_id);
CREATE INDEX IF NOT EXISTS idx_shipping_cargo_items_po_item_id ON lats_shipping_cargo_items(purchase_order_item_id);

-- Indexes for product validation
CREATE INDEX IF NOT EXISTS idx_product_validation_product_id ON lats_product_validation(product_id);
CREATE INDEX IF NOT EXISTS idx_product_validation_shipping_id ON lats_product_validation(shipping_id);
CREATE INDEX IF NOT EXISTS idx_product_validation_validated ON lats_product_validation(is_validated);

-- Index for products by status
CREATE INDEX IF NOT EXISTS idx_products_status ON lats_products(status);

-- =====================================================
-- CREATE FUNCTIONS FOR WORKFLOW
-- =====================================================

-- Function to create draft products from purchase order items
CREATE OR REPLACE FUNCTION create_draft_products_from_po(
    p_purchase_order_id UUID,
    p_shipping_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    products_created INTEGER,
    error_message TEXT
) AS $$
DECLARE
    po_item RECORD;
    new_product_id UUID;
    products_created_count INTEGER := 0;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Loop through purchase order items with exchange rate info
        FOR po_item IN 
            SELECT 
                poi.*, 
                p.name as product_name, 
                p.description as product_description,
                po.currency as po_currency,
                po.exchange_rate as po_exchange_rate,
                po.base_currency as po_base_currency
            FROM lats_purchase_order_items poi
            LEFT JOIN lats_products p ON poi.product_id = p.id
            LEFT JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
            WHERE poi.purchase_order_id = p_purchase_order_id
        LOOP
            -- Create draft product if it doesn't exist or is not already linked
            IF NOT EXISTS (
                SELECT 1 FROM lats_shipping_cargo_items 
                WHERE shipping_id = p_shipping_id 
                AND product_id = po_item.product_id
            ) THEN
                -- Calculate cost price in base currency (TZS) using exchange rate
                DECLARE
                    converted_cost_price DECIMAL(10,2);
                BEGIN
                    -- If currency is already TZS or no exchange rate, use original cost price
                    IF po_item.po_currency = 'TZS' OR po_item.po_currency IS NULL OR po_item.po_exchange_rate IS NULL OR po_item.po_exchange_rate = 0 THEN
                        converted_cost_price := po_item.cost_price;
                    ELSE
                        -- Convert from foreign currency to TZS using exchange rate
                        converted_cost_price := po_item.cost_price * po_item.po_exchange_rate;
                    END IF;
                    
                    -- Insert into shipping cargo items with converted cost price
                    INSERT INTO lats_shipping_cargo_items (
                        shipping_id,
                        product_id,
                        purchase_order_item_id,
                        quantity,
                        cost_price,
                        description
                    ) VALUES (
                        p_shipping_id,
                        po_item.product_id,
                        po_item.id,
                        po_item.quantity,
                        converted_cost_price,
                        COALESCE(po_item.product_name, 'Product from PO')
                    );
                END;
                
                products_created_count := products_created_count + 1;
            END IF;
        END LOOP;
        
        -- Return success
        RETURN QUERY SELECT true, products_created_count, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, 0, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate if all products in a shipment are ready for inventory
CREATE OR REPLACE FUNCTION check_shipment_ready_for_inventory(
    p_shipping_id UUID
) RETURNS TABLE(
    is_ready BOOLEAN,
    total_products INTEGER,
    validated_products INTEGER,
    missing_products INTEGER
) AS $$
DECLARE
    total_count INTEGER;
    validated_count INTEGER;
    missing_count INTEGER;
BEGIN
    -- Count total products in shipment
    SELECT COUNT(*) INTO total_count
    FROM lats_shipping_cargo_items
    WHERE shipping_id = p_shipping_id;
    
    -- Count validated products
    SELECT COUNT(*) INTO validated_count
    FROM lats_shipping_cargo_items sci
    JOIN lats_product_validation pv ON sci.product_id = pv.product_id AND sci.shipping_id = pv.shipping_id
    WHERE sci.shipping_id = p_shipping_id AND pv.is_validated = true;
    
    -- Calculate missing products
    missing_count := total_count - validated_count;
    
    -- Return results
    RETURN QUERY SELECT 
        (validated_count = total_count AND total_count > 0) as is_ready,
        total_count,
        validated_count,
        missing_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to move validated products to inventory
CREATE OR REPLACE FUNCTION move_products_to_inventory(
    p_shipping_id UUID,
    p_user_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    products_moved INTEGER,
    error_message TEXT
) AS $$
DECLARE
    cargo_item RECORD;
    products_moved_count INTEGER := 0;
    error_msg TEXT;
BEGIN
    BEGIN
        -- Check if shipment is ready for inventory
        IF NOT EXISTS (
            SELECT 1 FROM check_shipment_ready_for_inventory(p_shipping_id) WHERE is_ready = true
        ) THEN
            RETURN QUERY SELECT false, 0, 'Shipment not ready for inventory - some products not validated'::TEXT;
            RETURN;
        END IF;
        
        -- Loop through validated cargo items
        FOR cargo_item IN 
            SELECT sci.*, pv.is_validated
            FROM lats_shipping_cargo_items sci
            JOIN lats_product_validation pv ON sci.product_id = pv.product_id AND sci.shipping_id = pv.shipping_id
            WHERE sci.shipping_id = p_shipping_id AND pv.is_validated = true
        LOOP
            -- Update product status to active
            UPDATE lats_products 
            SET status = 'active', updated_at = NOW()
            WHERE id = cargo_item.product_id;
            
            -- Update product stock quantities
            UPDATE lats_product_variants 
            SET quantity = quantity + cargo_item.quantity, updated_at = NOW()
            WHERE product_id = cargo_item.product_id;
            
            -- Update main product total quantity
            UPDATE lats_products 
            SET total_quantity = total_quantity + cargo_item.quantity, updated_at = NOW()
            WHERE id = cargo_item.product_id;
            
            products_moved_count := products_moved_count + 1;
        END LOOP;
        
        -- Return success
        RETURN QUERY SELECT true, products_moved_count, NULL::TEXT;
        
    EXCEPTION WHEN OTHERS THEN
        -- Return error
        error_msg := SQLERRM;
        RETURN QUERY SELECT false, 0, error_msg;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_draft_products_from_po TO authenticated;
GRANT EXECUTE ON FUNCTION check_shipment_ready_for_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION move_products_to_inventory TO authenticated;

-- =====================================================
-- ENABLE RLS POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE lats_shipping_cargo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_validation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shipping cargo items
CREATE POLICY "Users can view shipping cargo items" ON lats_shipping_cargo_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert shipping cargo items" ON lats_shipping_cargo_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update shipping cargo items" ON lats_shipping_cargo_items
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create RLS policies for product validation
CREATE POLICY "Users can view product validation" ON lats_product_validation
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert product validation" ON lats_product_validation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update product validation" ON lats_product_validation
    FOR UPDATE USING (auth.role() = 'authenticated');

-- =====================================================
-- CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Trigger to automatically create draft products when shipping is created
CREATE OR REPLACE FUNCTION trigger_create_draft_products()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create draft products for new shipping records
    IF TG_OP = 'INSERT' THEN
        -- Create draft products from purchase order
        PERFORM create_draft_products_from_po(NEW.purchase_order_id, NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS create_draft_products_trigger ON lats_shipping_info;
CREATE TRIGGER create_draft_products_trigger
    AFTER INSERT ON lats_shipping_info
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_draft_products();

-- =====================================================
-- UPDATE COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE lats_shipping_cargo_items IS 'Links draft products to shipping cargo items for the validation workflow';
COMMENT ON TABLE lats_product_validation IS 'Tracks validation status of draft products before they can be moved to inventory';

-- Add workflow documentation
COMMENT ON SCHEMA public IS 'LATS Inventory Management System - Updated with Draft Products Workflow: PO → Draft Product → Shipping → Validation → Inventory';
