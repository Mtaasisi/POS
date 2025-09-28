-- =====================================================
-- FIX PAYMENT_PROVIDERS TABLE STRUCTURE
-- =====================================================
-- This script adds missing columns to the existing payment_providers table

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_providers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add provider_code column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'provider_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN provider_code VARCHAR(20) UNIQUE;
        RAISE NOTICE 'Added provider_code column';
    ELSE
        RAISE NOTICE 'provider_code column already exists';
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column';
    ELSE
        RAISE NOTICE 'description column already exists';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE 'Added status column';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_providers' 
        AND column_name = 'updated_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE payment_providers ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'payment_providers' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert default payment providers (only if table is empty)
INSERT INTO payment_providers (name, type, provider_code, description, status) VALUES
('Cash', 'cash', 'CASH', 'Physical cash payments', 'active'),
('Card', 'card', 'CARD', 'Credit/Debit card payments', 'active'),
('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments', 'active'),
('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments', 'active')
ON CONFLICT (name) DO NOTHING;

-- Verify the data was inserted
SELECT id, name, type, provider_code, status FROM payment_providers ORDER BY name;
