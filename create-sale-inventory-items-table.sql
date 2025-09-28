-- Create Sale Inventory Items Table
-- This table links sales to specific serialized inventory items

-- Create sale_inventory_items table for tracking which specific items were sold
CREATE TABLE IF NOT EXISTS sale_inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_inventory_items_unique 
ON sale_inventory_items(sale_id, inventory_item_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_sale_id ON sale_inventory_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_inventory_item_id ON sale_inventory_items(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_customer_id ON sale_inventory_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_inventory_items_created_at ON sale_inventory_items(created_at);

-- Enable RLS
ALTER TABLE sale_inventory_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON sale_inventory_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sale_inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sale_inventory_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON sale_inventory_items FOR DELETE USING (true);

-- Create function to automatically update inventory item status when linked to sale
CREATE OR REPLACE FUNCTION update_inventory_item_status_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the inventory item status to 'sold' when linked to a sale
    UPDATE inventory_items 
    SET status = 'sold', updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update status
CREATE TRIGGER trigger_update_inventory_item_status_on_sale
    AFTER INSERT ON sale_inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_item_status_on_sale();

-- Create function to get customer's serial number history
CREATE OR REPLACE FUNCTION get_customer_serial_history(customer_id_param UUID)
RETURNS TABLE(
    sale_id UUID,
    sale_date TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL(10,2),
    serial_number VARCHAR(255),
    imei VARCHAR(20),
    product_name VARCHAR(255),
    item_status VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.sale_id,
        s.created_at as sale_date,
        s.total_amount,
        ii.serial_number,
        ii.imei,
        p.name as product_name,
        ii.status as item_status
    FROM sale_inventory_items si
    JOIN lats_sales s ON si.sale_id = s.id
    JOIN inventory_items ii ON si.inventory_item_id = ii.id
    JOIN lats_products p ON ii.product_id = p.id
    WHERE si.customer_id = customer_id_param
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get sale details with serial numbers
CREATE OR REPLACE FUNCTION get_sale_with_serial_numbers(sale_id_param UUID)
RETURNS TABLE(
    sale_id UUID,
    customer_name VARCHAR(255),
    sale_date TIMESTAMP WITH TIME ZONE,
    total_amount DECIMAL(10,2),
    serial_number VARCHAR(255),
    imei VARCHAR(20),
    product_name VARCHAR(255),
    item_cost_price DECIMAL(10,2),
    item_selling_price DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as sale_id,
        s.customer_name,
        s.created_at as sale_date,
        s.total_amount,
        ii.serial_number,
        ii.imei,
        p.name as product_name,
        ii.cost_price as item_cost_price,
        ii.selling_price as item_selling_price
    FROM lats_sales s
    JOIN sale_inventory_items si ON s.id = si.sale_id
    JOIN inventory_items ii ON si.inventory_item_id = ii.id
    JOIN lats_products p ON ii.product_id = p.id
    WHERE s.id = sale_id_param
    ORDER BY ii.serial_number;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy access to sales with serial numbers
CREATE OR REPLACE VIEW sales_with_serial_numbers AS
SELECT 
    s.id as sale_id,
    s.sale_number,
    s.customer_name,
    s.customer_phone,
    s.created_at as sale_date,
    s.total_amount,
    s.payment_method,
    ii.serial_number,
    ii.imei,
    ii.mac_address,
    p.name as product_name,
    p.sku as product_sku,
    ii.cost_price,
    ii.selling_price,
    ii.status as item_status,
    ii.location as item_location
FROM lats_sales s
JOIN sale_inventory_items si ON s.id = si.sale_id
JOIN inventory_items ii ON si.inventory_item_id = ii.id
JOIN lats_products p ON ii.product_id = p.id
ORDER BY s.created_at DESC, ii.serial_number;

-- Grant permissions on the view
GRANT SELECT ON sales_with_serial_numbers TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE sale_inventory_items IS 'Links sales to specific serialized inventory items for complete traceability';
COMMENT ON COLUMN sale_inventory_items.sale_id IS 'Reference to the sale record';
COMMENT ON COLUMN sale_inventory_items.inventory_item_id IS 'Reference to the specific inventory item sold';
COMMENT ON COLUMN sale_inventory_items.customer_id IS 'Reference to the customer who purchased the item';

COMMENT ON FUNCTION get_customer_serial_history IS 'Returns the serial number purchase history for a specific customer';
COMMENT ON FUNCTION get_sale_with_serial_numbers IS 'Returns detailed information about a sale including all serialized items';
COMMENT ON VIEW sales_with_serial_numbers IS 'Complete view of all sales with their associated serial numbers and item details';
