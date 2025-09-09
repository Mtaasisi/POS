-- Add air shipping specific fields to lats_shipping_info table
-- These fields are needed for comprehensive air shipping with agent integration

-- Add air shipping specific fields
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS shipping_agent_id UUID,
ADD COLUMN IF NOT EXISTS cargo_type TEXT CHECK (cargo_type IN ('per_piece', 'per_kg')),
ADD COLUMN IF NOT EXISTS item_description TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS extra_transport_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Add foreign key constraint for shipping agent
ALTER TABLE lats_shipping_info 
ADD CONSTRAINT fk_shipping_agent_id 
FOREIGN KEY (shipping_agent_id) REFERENCES lats_shipping_agents(id) ON DELETE SET NULL;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_shipping_agent_id ON lats_shipping_info(shipping_agent_id);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_cargo_type ON lats_shipping_info(cargo_type);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_receipt_number ON lats_shipping_info(receipt_number);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_quantity ON lats_shipping_info(quantity);

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.shipping_agent_id IS 'Reference to the selected shipping agent for air shipping';
COMMENT ON COLUMN lats_shipping_info.cargo_type IS 'Type of cargo pricing: per_piece or per_kg';
COMMENT ON COLUMN lats_shipping_info.item_description IS 'Description of items being shipped';
COMMENT ON COLUMN lats_shipping_info.quantity IS 'Quantity of items being shipped';
COMMENT ON COLUMN lats_shipping_info.receipt_number IS 'Receipt number for the shipment';
COMMENT ON COLUMN lats_shipping_info.extra_transport_cost IS 'Additional transport costs beyond agent pricing';
COMMENT ON COLUMN lats_shipping_info.unit_price IS 'Unit price based on agent pricing and cargo type';
COMMENT ON COLUMN lats_shipping_info.total_cost IS 'Total cost including unit price and extra transport costs';
