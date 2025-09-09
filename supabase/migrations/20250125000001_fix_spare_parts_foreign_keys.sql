-- Fix missing foreign key relationships in lats_spare_parts table
-- Migration: 20250125000001_fix_spare_parts_foreign_keys.sql

-- Add missing foreign key constraints to lats_spare_parts table
DO $$ 
BEGIN
    -- Add storage_room_id column and foreign key if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'storage_room_id') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN storage_room_id UUID;
        RAISE NOTICE 'Added storage_room_id column to lats_spare_parts';
    END IF;
    
    -- Add store_shelf_id column and foreign key if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'store_shelf_id') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN store_shelf_id UUID;
        RAISE NOTICE 'Added store_shelf_id column to lats_spare_parts';
    END IF;
    
    -- Add images column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'images') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN images TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added images column to lats_spare_parts';
    END IF;
    
    -- Add part_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'part_type') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN part_type TEXT DEFAULT 'general';
        RAISE NOTICE 'Added part_type column to lats_spare_parts';
    END IF;
    
    -- Add primary_device_type column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'primary_device_type') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN primary_device_type TEXT DEFAULT 'general';
        RAISE NOTICE 'Added primary_device_type column to lats_spare_parts';
    END IF;
    
    -- Add search_tags column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'search_tags') THEN
        ALTER TABLE public.lats_spare_parts ADD COLUMN search_tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added search_tags column to lats_spare_parts';
    END IF;
END $$;

-- Add foreign key constraints (only if the referenced tables exist)
DO $$ 
BEGIN
    -- Add storage_room_id foreign key constraint
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lats_storage_rooms') THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_spare_parts_storage_room' 
            AND table_name = 'lats_spare_parts'
        ) THEN
            ALTER TABLE public.lats_spare_parts 
            ADD CONSTRAINT fk_spare_parts_storage_room 
            FOREIGN KEY (storage_room_id) REFERENCES lats_storage_rooms(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added storage_room_id foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'lats_storage_rooms table does not exist, skipping storage_room_id foreign key';
    END IF;
    
    -- Add store_shelf_id foreign key constraint
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lats_store_shelves') THEN
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_spare_parts_store_shelf' 
            AND table_name = 'lats_spare_parts'
        ) THEN
            ALTER TABLE public.lats_spare_parts 
            ADD CONSTRAINT fk_spare_parts_store_shelf 
            FOREIGN KEY (store_shelf_id) REFERENCES lats_store_shelves(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added store_shelf_id foreign key constraint';
        END IF;
    ELSE
        RAISE NOTICE 'lats_store_shelves table does not exist, skipping store_shelf_id foreign key';
    END IF;
    
    -- Verify category_id foreign key exists
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%category%' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE public.lats_spare_parts 
        ADD CONSTRAINT fk_spare_parts_category 
        FOREIGN KEY (category_id) REFERENCES lats_categories(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added category_id foreign key constraint';
    END IF;
    
    -- Verify supplier_id foreign key exists
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%supplier%' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE public.lats_spare_parts 
        ADD CONSTRAINT fk_spare_parts_supplier 
        FOREIGN KEY (supplier_id) REFERENCES lats_suppliers(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added supplier_id foreign key constraint';
    END IF;
    
    -- Verify created_by foreign key exists
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%created_by%' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE public.lats_spare_parts 
        ADD CONSTRAINT fk_spare_parts_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added created_by foreign key constraint';
    END IF;
    
    -- Verify updated_by foreign key exists
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%updated_by%' 
        AND table_name = 'lats_spare_parts'
    ) THEN
        ALTER TABLE public.lats_spare_parts 
        ADD CONSTRAINT fk_spare_parts_updated_by 
        FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added updated_by foreign key constraint';
    END IF;
END $$;

-- Create indexes for the new columns
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lats_spare_parts') THEN
        -- Storage room index
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'storage_room_id') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_storage_room ON public.lats_spare_parts(storage_room_id);
        END IF;
        
        -- Store shelf index
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'store_shelf_id') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_store_shelf ON public.lats_spare_parts(store_shelf_id);
        END IF;
        
        -- Part type index
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'part_type') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_part_type ON public.lats_spare_parts(part_type);
        END IF;
        
        -- Primary device type index
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'primary_device_type') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_primary_device_type ON public.lats_spare_parts(primary_device_type);
        END IF;
        
        -- Search tags GIN index for array operations
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'lats_spare_parts' AND column_name = 'search_tags') THEN
            CREATE INDEX IF NOT EXISTS idx_spare_parts_search_tags ON public.lats_spare_parts USING GIN(search_tags);
        END IF;
    END IF;
END $$;

-- Add comments to document the relationships
COMMENT ON COLUMN lats_spare_parts.category_id IS 'Reference to category in lats_categories table';
COMMENT ON COLUMN lats_spare_parts.supplier_id IS 'Reference to supplier in lats_suppliers table';
COMMENT ON COLUMN lats_spare_parts.storage_room_id IS 'Reference to storage room in lats_storage_rooms table';
COMMENT ON COLUMN lats_spare_parts.store_shelf_id IS 'Reference to store shelf in lats_store_shelves table';
COMMENT ON COLUMN lats_spare_parts.created_by IS 'Reference to user who created this record';
COMMENT ON COLUMN lats_spare_parts.updated_by IS 'Reference to user who last updated this record';
COMMENT ON COLUMN lats_spare_parts.images IS 'Array of image URLs for the spare part';
COMMENT ON COLUMN lats_spare_parts.part_type IS 'Type of spare part (e.g., screen, battery, cable)';
COMMENT ON COLUMN lats_spare_parts.primary_device_type IS 'Primary device type this part is for (e.g., phone, laptop)';
COMMENT ON COLUMN lats_spare_parts.search_tags IS 'Array of search tags for easy filtering';
