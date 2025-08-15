-- Migration: Add missing fields to lats_products table
-- This migration adds fields that are defined in ProductFormData but missing from the database

-- Add missing fields to lats_products table
ALTER TABLE lats_products 
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.16,
ADD COLUMN IF NOT EXISTS debut_date DATE,
ADD COLUMN IF NOT EXISTS debut_notes TEXT,
ADD COLUMN IF NOT EXISTS debut_features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_lats_products_featured ON lats_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_lats_products_digital ON lats_products(is_digital);
CREATE INDEX IF NOT EXISTS idx_lats_products_debut_date ON lats_products(debut_date);

-- Update existing products to have default values
UPDATE lats_products 
SET 
  is_featured = false,
  is_digital = false,
  requires_shipping = true,
  tax_rate = 0.16,
  debut_features = '{}',
  metadata = '{}'
WHERE is_featured IS NULL 
   OR is_digital IS NULL 
   OR requires_shipping IS NULL 
   OR tax_rate IS NULL 
   OR debut_features IS NULL 
   OR metadata IS NULL;
