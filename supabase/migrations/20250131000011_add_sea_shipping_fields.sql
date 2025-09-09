-- Add sea shipping specific fields to lats_shipping_info table
-- These fields are needed for comprehensive sea shipping tracking

-- Add sea shipping specific fields
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS port_of_loading TEXT,
ADD COLUMN IF NOT EXISTS port_of_discharge TEXT,
ADD COLUMN IF NOT EXISTS departure_date DATE,
ADD COLUMN IF NOT EXISTS arrival_date DATE,
ADD COLUMN IF NOT EXISTS container_number TEXT,
ADD COLUMN IF NOT EXISTS bill_of_lading TEXT,
ADD COLUMN IF NOT EXISTS customs_declaration TEXT;

-- Add additional package and cargo details
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS total_cbm DECIMAL(8,3),
ADD COLUMN IF NOT EXISTS price_per_cbm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_cbm_cost DECIMAL(10,2);

-- Add insurance and special handling fields
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS require_signature BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insurance_value DECIMAL(10,2) DEFAULT 0;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_port_of_loading ON lats_shipping_info(port_of_loading);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_port_of_discharge ON lats_shipping_info(port_of_discharge);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_container_number ON lats_shipping_info(container_number);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_bill_of_lading ON lats_shipping_info(bill_of_lading);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_departure_date ON lats_shipping_info(departure_date);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_arrival_date ON lats_shipping_info(arrival_date);

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.port_of_loading IS 'Port where the shipment was loaded';
COMMENT ON COLUMN lats_shipping_info.port_of_discharge IS 'Port where the shipment will be discharged';
COMMENT ON COLUMN lats_shipping_info.departure_date IS 'Date when the vessel/ship departed';
COMMENT ON COLUMN lats_shipping_info.arrival_date IS 'Date when the vessel/ship arrived';
COMMENT ON COLUMN lats_shipping_info.container_number IS 'Container number for sea shipping';
COMMENT ON COLUMN lats_shipping_info.bill_of_lading IS 'Bill of lading number';
COMMENT ON COLUMN lats_shipping_info.customs_declaration IS 'Customs declaration number';
COMMENT ON COLUMN lats_shipping_info.total_cbm IS 'Total cubic meters of cargo';
COMMENT ON COLUMN lats_shipping_info.price_per_cbm IS 'Price per cubic meter';
COMMENT ON COLUMN lats_shipping_info.total_cbm_cost IS 'Total cost based on CBM';
COMMENT ON COLUMN lats_shipping_info.require_signature IS 'Whether signature is required for delivery';
COMMENT ON COLUMN lats_shipping_info.enable_insurance IS 'Whether package insurance is enabled';
COMMENT ON COLUMN lats_shipping_info.insurance_value IS 'Insurance value of the package';
