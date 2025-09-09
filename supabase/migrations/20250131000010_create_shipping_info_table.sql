-- Create lats_shipping_info table for tracking shipping information
-- This table stores detailed shipping information for products and orders

CREATE TABLE IF NOT EXISTS lats_shipping_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES lats_products(id) ON DELETE CASCADE,
  purchase_order_id UUID REFERENCES lats_purchase_orders(id) ON DELETE CASCADE,
  
  -- Shipping details
  tracking_number TEXT,
  carrier_name TEXT,
  shipping_agent TEXT,
  shipping_manager TEXT,
  
  -- Origin and destination
  origin_address TEXT,
  origin_city TEXT,
  origin_country TEXT DEFAULT 'Tanzania',
  destination_address TEXT,
  destination_city TEXT DEFAULT 'Dar es Salaam',
  destination_country TEXT DEFAULT 'Tanzania',
  
  -- Shipping status and dates
  shipping_status TEXT DEFAULT 'pending' CHECK (shipping_status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception')),
  shipped_date TIMESTAMP WITH TIME ZONE,
  expected_delivery_date TIMESTAMP WITH TIME ZONE,
  actual_delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- Shipping costs
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  freight_cost DECIMAL(10,2) DEFAULT 0,
  delivery_cost DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  customs_cost DECIMAL(10,2) DEFAULT 0,
  handling_cost DECIMAL(10,2) DEFAULT 0,
  total_shipping_cost DECIMAL(10,2) DEFAULT 0,
  shipping_cost_currency TEXT DEFAULT 'TZS',
  
  -- Package details
  package_weight DECIMAL(8,2),
  package_length DECIMAL(8,2),
  package_width DECIMAL(8,2),
  package_height DECIMAL(8,2),
  package_cbm DECIMAL(8,3),
  package_count INTEGER DEFAULT 1,
  
  -- Special handling
  requires_special_handling BOOLEAN DEFAULT false,
  is_fragile BOOLEAN DEFAULT false,
  is_hazardous BOOLEAN DEFAULT false,
  temperature_controlled BOOLEAN DEFAULT false,
  
  -- Communication
  notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_product_id ON lats_shipping_info(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_purchase_order_id ON lats_shipping_info(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_tracking_number ON lats_shipping_info(tracking_number);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_shipping_status ON lats_shipping_info(shipping_status);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_carrier_name ON lats_shipping_info(carrier_name);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_shipped_date ON lats_shipping_info(shipped_date);

-- Add comments for documentation
COMMENT ON TABLE lats_shipping_info IS 'Stores detailed shipping information for products and purchase orders';
COMMENT ON COLUMN lats_shipping_info.product_id IS 'Reference to the product being shipped';
COMMENT ON COLUMN lats_shipping_info.purchase_order_id IS 'Reference to the purchase order';
COMMENT ON COLUMN lats_shipping_info.tracking_number IS 'Carrier tracking number';
COMMENT ON COLUMN lats_shipping_info.carrier_name IS 'Shipping carrier name (DHL, TNT, Posta, FedEx, etc.)';
COMMENT ON COLUMN lats_shipping_info.shipping_agent IS 'Individual shipping handler';
COMMENT ON COLUMN lats_shipping_info.shipping_manager IS 'Logistics team leader';
COMMENT ON COLUMN lats_shipping_info.shipping_status IS 'Current shipping status';
COMMENT ON COLUMN lats_shipping_info.origin_country IS 'Default origin country (Tanzania)';
COMMENT ON COLUMN lats_shipping_info.destination_city IS 'Default destination city (Dar es Salaam)';
COMMENT ON COLUMN lats_shipping_info.destination_country IS 'Default destination country (Tanzania)';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_lats_shipping_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lats_shipping_info_updated_at
  BEFORE UPDATE ON lats_shipping_info
  FOR EACH ROW
  EXECUTE FUNCTION update_lats_shipping_info_updated_at();

-- Enable Row Level Security
ALTER TABLE lats_shipping_info ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users
CREATE POLICY "Allow authenticated users to manage shipping info"
  ON lats_shipping_info
  FOR ALL
  USING (auth.role() = 'authenticated');
