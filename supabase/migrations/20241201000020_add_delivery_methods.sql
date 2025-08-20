-- Add delivery_methods field to lats_pos_delivery_settings table
-- This migration adds support for configurable delivery methods

-- Add the delivery_methods column to the existing table
ALTER TABLE lats_pos_delivery_settings 
ADD COLUMN IF NOT EXISTS delivery_methods JSONB DEFAULT '[
  {
    "id": "1",
    "name": "Standard Delivery",
    "description": "2-3 business days",
    "price": 500,
    "estimatedTime": "2-3 days",
    "isDefault": true,
    "enabled": true
  },
  {
    "id": "2", 
    "name": "Express Delivery",
    "description": "1-2 business days",
    "price": 1000,
    "estimatedTime": "1-2 days",
    "isDefault": false,
    "enabled": true
  },
  {
    "id": "3",
    "name": "Same Day Delivery", 
    "description": "Same day",
    "price": 2000,
    "estimatedTime": "Same day",
    "isDefault": false,
    "enabled": true
  }
]';

-- Add a comment to document the new field
COMMENT ON COLUMN lats_pos_delivery_settings.delivery_methods IS 'JSON array of delivery method objects with id, name, description, price, estimatedTime, isDefault, and enabled fields';

-- Create an index on the delivery_methods column for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_settings_methods 
ON lats_pos_delivery_settings USING GIN (delivery_methods);

-- Update existing records to have the default delivery methods if they don't have any
UPDATE lats_pos_delivery_settings 
SET delivery_methods = '[
  {
    "id": "1",
    "name": "Standard Delivery",
    "description": "2-3 business days",
    "price": 500,
    "estimatedTime": "2-3 days",
    "isDefault": true,
    "enabled": true
  },
  {
    "id": "2", 
    "name": "Express Delivery",
    "description": "1-2 business days",
    "price": 1000,
    "estimatedTime": "1-2 days",
    "isDefault": false,
    "enabled": true
  },
  {
    "id": "3",
    "name": "Same Day Delivery", 
    "description": "Same day",
    "price": 2000,
    "estimatedTime": "Same day",
    "isDefault": false,
    "enabled": true
  }
]'
WHERE delivery_methods IS NULL;
