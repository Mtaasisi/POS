-- Add missing columns to existing lats_spare_parts table
-- This migration only adds columns that don't exist

DO $$ 
BEGIN
    -- Add brand column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'brand') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN brand VARCHAR(100);
        RAISE NOTICE 'Added brand column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'brand column already exists in lats_spare_parts';
    END IF;
    
    -- Add supplier_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN supplier_id UUID REFERENCES public.lats_suppliers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added supplier_id column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'supplier_id column already exists in lats_spare_parts';
    END IF;
    
    -- Add condition column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'condition') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN condition VARCHAR(20) CHECK (condition IN ('new', 'used', 'refurbished'));
        RAISE NOTICE 'Added condition column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'condition column already exists in lats_spare_parts';
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'description') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'description column already exists in lats_spare_parts';
    END IF;
    
    -- Add selling_price column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'selling_price') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN selling_price DECIMAL(10,2) DEFAULT 0.00;
        RAISE NOTICE 'Added selling_price column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'selling_price column already exists in lats_spare_parts';
    END IF;
    
    -- Add compatible_devices column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'compatible_devices') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN compatible_devices TEXT;
        RAISE NOTICE 'Added compatible_devices column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'compatible_devices column already exists in lats_spare_parts';
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'created_by') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added created_by column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'created_by column already exists in lats_spare_parts';
    END IF;
    
    -- Add updated_by column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'updated_by') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added updated_by column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'updated_by column already exists in lats_spare_parts';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'created_at') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'created_at column already exists in lats_spare_parts';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'updated_at') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to lats_spare_parts';
    ELSE
        RAISE NOTICE 'updated_at column already exists in lats_spare_parts';
    END IF;
END $$;

-- Create indexes only if they don't exist
DO $$ 
BEGIN
    -- Only create indexes if the table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lats_spare_parts') THEN
        CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON public.lats_spare_parts(part_number);
        CREATE INDEX IF NOT EXISTS idx_spare_parts_category_id ON public.lats_spare_parts(category_id);
        CREATE INDEX IF NOT EXISTS idx_spare_parts_supplier_id ON public.lats_spare_parts(supplier_id);
        CREATE INDEX IF NOT EXISTS idx_spare_parts_condition ON public.lats_spare_parts(condition);
        CREATE INDEX IF NOT EXISTS idx_spare_parts_is_active ON public.lats_spare_parts(is_active);
        
        -- Only create created_at index if the column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_created_at ON public.lats_spare_parts(created_at);
        END IF;
    END IF;
END $$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at (only if table and column exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lats_spare_parts') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'updated_at') THEN
            DROP TRIGGER IF EXISTS update_spare_parts_updated_at ON public.lats_spare_parts;
            CREATE TRIGGER update_spare_parts_updated_at
                BEFORE UPDATE ON public.lats_spare_parts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;
