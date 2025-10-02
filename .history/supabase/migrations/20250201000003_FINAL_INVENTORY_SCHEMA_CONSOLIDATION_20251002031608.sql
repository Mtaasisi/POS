-- =====================================================
-- FINAL INVENTORY SCHEMA CONSOLIDATION
-- Migration: 20250201000003_FINAL_INVENTORY_SCHEMA_CONSOLIDATION.sql
-- Purpose: Clean up all conflicting migrations and create a single, clean schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES (Clean, Single Definition)
-- =====================================================

-- Auth users table (if not using Supabase auth.users)
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    username TEXT,
    name TEXT,
    role TEXT DEFAULT 'technician',
    is_active BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    loyalty_level TEXT DEFAULT 'bronze',
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    color_tag TEXT DEFAULT '#3B82F6',
    joined_date TIMESTAMP WITH TIME ZONE,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    total_purchases INTEGER DEFAULT 0,
    birthday DATE,
    whatsapp_opt_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LATS INVENTORY TABLES (Clean Definitions)
-- =====================================================

-- Categories table
CREATE TABLE IF NOT EXISTS lats_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands table
CREATE TABLE IF NOT EXISTS lats_brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table (Consolidated)
CREATE TABLE IF NOT EXISTS lats_suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    description TEXT,
    contact_person TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    phone TEXT,
    phone2 TEXT,
    whatsapp TEXT,
    instagram TEXT,
    wechat_id TEXT,
    city TEXT,
    country TEXT DEFAULT 'TZ',
    currency TEXT DEFAULT 'TZS',
    payment_terms TEXT,
    lead_time_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store locations table
CREATE TABLE IF NOT EXISTS lats_store_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'TZ',
    phone TEXT,
    email TEXT,
    manager_name TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage rooms table
CREATE TABLE IF NOT EXISTS lats_storage_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    location_id UUID REFERENCES lats_store_locations(id) ON DELETE SET NULL,
    description TEXT,
    is_refrigerated BOOLEAN DEFAULT false,
    requires_ladder BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Store shelves table
CREATE TABLE IF NOT EXISTS lats_store_shelves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    storage_room_id UUID REFERENCES lats_storage_rooms(id) ON DELETE SET NULL,
    shelf_code TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table (Consolidated)
CREATE TABLE IF NOT EXISTS lats_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lats_categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES lats_suppliers(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES lats_brands(id) ON DELETE SET NULL,
    condition TEXT DEFAULT 'new',
    internal_notes TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'inactive')),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    store_shelf_id UUID REFERENCES lats_store_shelves(id) ON DELETE SET NULL,
    storage_room_id UUID REFERENCES lats_storage_rooms(id) ON DELETE SET NULL,
    location_id UUID REFERENCES lats_store_locations(id) ON DELETE SET NULL,
    attributes JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants table (Consolidated)
CREATE TABLE IF NOT EXISTS lats_product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    barcode TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, sku)
);

-- Product images table
CREATE TABLE IF NOT EXISTS lats_product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS lats_stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL DEFAULT 0,
    new_quantity INTEGER NOT NULL DEFAULT 0,
    reason TEXT NOT NULL,
    reference TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Serial number tracking table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES lats_product_variants(id) ON DELETE CASCADE,
    serial_number VARCHAR(255) NOT NULL,
    imei VARCHAR(20),
    mac_address VARCHAR(17),
    barcode VARCHAR(100),
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'returned', 'repair', 'warranty')),
    location VARCHAR(100),
    shelf VARCHAR(50),
    bin VARCHAR(50),
    purchase_date DATE,
    warranty_start DATE,
    warranty_end DATE,
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth_users(id)
);

-- =====================================================
-- INDEXES (Performance Optimization)
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_lats_products_category_id ON lats_products(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_supplier_id ON lats_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_brand_id ON lats_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_status ON lats_products(status);
CREATE INDEX IF NOT EXISTS idx_lats_products_is_active ON lats_products(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_products_store_shelf_id ON lats_products(store_shelf_id);

-- Variants indexes
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_is_active ON lats_suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_name ON lats_suppliers(name);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_product_id ON lats_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_variant_id ON lats_stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_type ON lats_stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_lats_stock_movements_created_at ON lats_stock_movements(created_at);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_variant_id ON inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_serial_number ON inventory_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_serial_product ON inventory_items(product_id, serial_number);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_storage_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_store_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow all for authenticated users)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON auth_users;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customers;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_categories;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_brands;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_suppliers;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_store_locations;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_storage_rooms;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_store_shelves;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_products;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_product_variants;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_product_images;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_stock_movements;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON inventory_items;
    
    -- Create new policies
    CREATE POLICY "Enable all access for authenticated users" ON auth_users FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON customers FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_categories FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_brands FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_suppliers FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_store_locations FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_storage_rooms FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_store_shelves FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_products FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_product_variants FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_product_images FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON lats_stock_movements FOR ALL USING (true);
    CREATE POLICY "Enable all access for authenticated users" ON inventory_items FOR ALL USING (true);
END $$;

-- =====================================================
-- CLEANUP INSTRUCTIONS
-- =====================================================

-- This migration consolidates all the conflicting schema definitions
-- After running this migration successfully, you should:
-- 1. Test your application thoroughly
-- 2. Consider removing old conflicting migration files (backup first!)
-- 3. Update your database types if needed
-- 4. Verify all foreign key relationships work correctly

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT 
    'Tables Created' as check_type,
    table_name,
    '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'auth_users', 'customers', 'lats_categories', 'lats_brands', 
    'lats_suppliers', 'lats_store_locations', 'lats_storage_rooms', 
    'lats_store_shelves', 'lats_products', 'lats_product_variants', 
    'lats_product_images', 'lats_stock_movements', 'inventory_items'
)
ORDER BY table_name;

-- Verify key indexes exist
SELECT 
    'Indexes Created' as check_type,
    indexname,
    '✅' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname;
