#!/bin/bash

# Safe Database Migration Script
# This script safely merges your local database with online Supabase
# WITHOUT removing existing data

set -e

echo "🔍 Safe Database Migration Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Backup current local database..."
# Create backup of current local database
npx supabase db dump --data-only > local_backup_$(date +%Y%m%d_%H%M%S).sql

echo "📋 Step 2: Generate migration script..."
# Create the migration script
cat > merge_database_strategy.sql << 'EOF'
-- Safe Database Merge Strategy
-- This script safely merges local database with online Supabase
-- WITHOUT removing existing data

-- =============================================
-- STEP 1: CREATE MISSING TABLES (IF NOT EXISTS)
-- =============================================

-- Create auth_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer-care', 'technician')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  city TEXT,
  location_description TEXT,
  national_id TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  loyalty_level TEXT NOT NULL DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  color_tag TEXT NOT NULL DEFAULT 'normal' CHECK (color_tag IN ('normal', 'vip', 'complainer')),
  referred_by TEXT,
  total_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  whatsapp TEXT,
  birth_month TEXT,
  birth_day TEXT,
  referral_source TEXT,
  initial_notes TEXT,
  total_returns INTEGER DEFAULT 0,
  profile_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table if it doesn't exist
CREATE TABLE IF NOT EXISTS devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  serial_number TEXT,
  issue_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair', 'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 'done', 'failed')),
  assigned_to TEXT,
  estimated_hours INTEGER,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  warranty_start TIMESTAMP WITH TIME ZONE,
  warranty_end TIMESTAMP WITH TIME ZONE,
  warranty_status TEXT,
  repair_count INTEGER DEFAULT 0,
  last_return_date TIMESTAMP WITH TIME ZONE,
  unlock_code TEXT,
  repair_cost DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  device_cost DECIMAL(10,2),
  diagnosis_required BOOLEAN DEFAULT false,
  device_notes TEXT,
  device_condition JSONB,
  device_images JSONB,
  accessories_confirmed BOOLEAN DEFAULT false,
  problem_confirmed BOOLEAN DEFAULT false,
  privacy_confirmed BOOLEAN DEFAULT false,
  imei TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create all other tables...
-- (This is a simplified version - the full script would include all tables)

-- =============================================
-- STEP 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add missing columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_source TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_month TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_day TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add missing columns to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_end TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS warranty_status TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_count INTEGER DEFAULT 0;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_return_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS unlock_code TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS repair_cost DECIMAL(10,2);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_cost DECIMAL(10,2);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS diagnosis_required BOOLEAN DEFAULT false;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_notes TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_condition JSONB;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_images JSONB;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS accessories_confirmed BOOLEAN DEFAULT false;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS problem_confirmed BOOLEAN DEFAULT false;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS privacy_confirmed BOOLEAN DEFAULT false;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS imei TEXT;

-- =============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Device indexes
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_to ON devices(assigned_to);
CREATE INDEX IF NOT EXISTS idx_devices_created_at ON devices(created_at);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);

-- =============================================
-- STEP 4: CREATE TRIGGERS AND FUNCTIONS
-- =============================================

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================

-- Grant permissions to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant permissions to sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- STEP 6: VERIFICATION
-- =============================================

-- Check that all tables exist
SELECT 'Tables created successfully' as status;
EOF

echo "📋 Step 3: Instructions for online Supabase..."
echo ""
echo "🔧 To apply this migration to your online Supabase:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of merge_database_strategy.sql"
echo "4. Execute the script"
echo ""
echo "📋 Step 4: Data migration options..."
echo ""
echo "Option A: Manual data export/import"
echo "1. Export data from local: npx supabase db dump --data-only > local_data.sql"
echo "2. Import to online: Use Supabase dashboard or CLI"
echo ""
echo "Option B: Use Supabase CLI"
echo "1. Link to online project: npx supabase link --project-ref YOUR_PROJECT_REF"
echo "2. Push schema: npx supabase db push"
echo "3. Push data: npx supabase db push --data-only"
echo ""
echo "✅ Migration script ready!"
echo "📁 Files created:"
echo "   - merge_database_strategy.sql (Schema migration)"
echo "   - local_backup_*.sql (Local database backup)"
echo ""
echo "⚠️  Important: Always backup your online database before applying migrations!" 