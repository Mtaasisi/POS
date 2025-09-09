-- Fix missing package_count column in lats_shipping_info table
-- This migration ensures the package_count column exists for shipping status updates

-- Add package_count column if it doesn't exist
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS package_count INTEGER DEFAULT 1;

-- Add other missing columns that might be referenced in the code
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS total_cbm DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS price_per_cbm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cbm_cost DECIMAL(10,2);

-- Add sea shipping specific fields if they don't exist
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS port_of_loading TEXT,
ADD COLUMN IF NOT EXISTS port_of_discharge TEXT,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS container_number TEXT,
ADD COLUMN IF NOT EXISTS bill_of_lading TEXT,
ADD COLUMN IF NOT EXISTS customs_declaration TEXT;

-- Add insurance and special handling fields if they don't exist
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS require_signature BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_value DECIMAL(10,2) DEFAULT 0;

-- Add cost breakdown fields if they don't exist
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS freight_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customs_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS handling_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost_currency TEXT DEFAULT 'TZS';

-- Add special status tracking fields if they don't exist
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS products_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_received_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.package_count IS 'Number of packages in the shipment';
COMMENT ON COLUMN lats_shipping_info.total_cbm IS 'Total cubic meters of cargo';
COMMENT ON COLUMN lats_shipping_info.price_per_cbm IS 'Price per cubic meter';
COMMENT ON COLUMN lats_shipping_info.total_cbm_cost IS 'Total cost based on CBM';
COMMENT ON COLUMN lats_shipping_info.port_of_loading IS 'Port where the shipment was loaded';
COMMENT ON COLUMN lats_shipping_info.port_of_discharge IS 'Port where the shipment will be discharged';
COMMENT ON COLUMN lats_shipping_info.departure_date IS 'Date when the vessel/ship departed';
COMMENT ON COLUMN lats_shipping_info.arrival_date IS 'Date when the vessel/ship arrived';
COMMENT ON COLUMN lats_shipping_info.container_number IS 'Container number for sea shipping';
COMMENT ON COLUMN lats_shipping_info.bill_of_lading IS 'Bill of lading number';
COMMENT ON COLUMN lats_shipping_info.customs_declaration IS 'Customs declaration number';
COMMENT ON COLUMN lats_shipping_info.require_signature IS 'Whether signature is required for delivery';
COMMENT ON COLUMN lats_shipping_info.enable_insurance IS 'Whether package insurance is enabled';
COMMENT ON COLUMN lats_shipping_info.insurance_value IS 'Insurance value of the package';
COMMENT ON COLUMN lats_shipping_info.products_updated_at IS 'Timestamp when product details were last updated (status = arrived)';
COMMENT ON COLUMN lats_shipping_info.inventory_received_at IS 'Timestamp when shipment was received into inventory (status = received)';
