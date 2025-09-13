import { supabase } from '../../../lib/supabaseClient';

/**
 * Fix the product_images table to resolve 406 errors
 */
export async function fixProductImagesDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Fixing product_images table...');

    // Step 1: Check if the table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('product_images')
      .select('id')
      .limit(1);

    if (tableError) {
      console.log('📝 product_images table does not exist, creating it...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS product_images (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            thumbnail_url TEXT,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT DEFAULT 'image/jpeg',
            is_primary BOOLEAN DEFAULT false,
            uploaded_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create indexes for better performance
          CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
          CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
          CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);

          -- Enable RLS
          ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

          -- Create RLS policies
          CREATE POLICY "Allow authenticated users to view product images" 
            ON product_images FOR SELECT 
            USING (auth.role() = 'authenticated');

          CREATE POLICY "Allow authenticated users to insert product images" 
            ON product_images FOR INSERT 
            WITH CHECK (auth.role() = 'authenticated');

          CREATE POLICY "Allow authenticated users to update product images" 
            ON product_images FOR UPDATE 
            USING (auth.role() = 'authenticated');

          CREATE POLICY "Allow authenticated users to delete product images" 
            ON product_images FOR DELETE 
            USING (auth.role() = 'authenticated');
        `
      });

      if (createError) {
        throw new Error(`Table creation failed: ${createError.message}`);
      }

      console.log('✅ product_images table created successfully');
    } else {
      console.log('✅ product_images table already exists');
    }

    // Step 2: Add missing columns if they don't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add missing columns if they don't exist
        DO $$ 
        BEGIN
          -- Add thumbnail_url column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_images' 
            AND column_name = 'thumbnail_url'
          ) THEN
            ALTER TABLE product_images ADD COLUMN thumbnail_url TEXT;
            RAISE NOTICE 'Added thumbnail_url column';
          END IF;

          -- Add mime_type column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_images' 
            AND column_name = 'mime_type'
          ) THEN
            ALTER TABLE product_images ADD COLUMN mime_type TEXT DEFAULT 'image/jpeg';
            RAISE NOTICE 'Added mime_type column';
          END IF;

          -- Add uploaded_by column if it doesn't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_images' 
            AND column_name = 'uploaded_by'
          ) THEN
            ALTER TABLE product_images ADD COLUMN uploaded_by UUID;
            RAISE NOTICE 'Added uploaded_by column';
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.warn('⚠️ Column addition failed:', alterError.message);
    }

    // Step 3: Ensure RLS policies are correct
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies and recreate them
        DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON product_images;
        DROP POLICY IF EXISTS "Allow authenticated users to insert product images" ON product_images;
        DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON product_images;
        DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON product_images;

        -- Create RLS policies
        CREATE POLICY "Allow authenticated users to view product images" 
          ON product_images FOR SELECT 
          USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to insert product images" 
          ON product_images FOR INSERT 
          WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to update product images" 
          ON product_images FOR UPDATE 
          USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to delete product images" 
          ON product_images FOR DELETE 
          USING (auth.role() = 'authenticated');
      `
    });

    if (policyError) {
      console.warn('⚠️ Policy recreation failed:', policyError.message);
    }

    // Step 4: Test the table
    const { data: testData, error: testError } = await supabase
      .from('product_images')
      .select('id')
      .limit(1);

    if (testError) {
      throw new Error(`Table test failed: ${testError.message}`);
    }

    console.log('✅ product_images table is working correctly');

    return {
      success: true,
      message: 'Product images table fixed successfully! The 406 errors should now be resolved.'
    };

  } catch (error) {
    console.error('❌ Error fixing product_images table:', error);
    return {
      success: false,
      message: `Failed to fix product_images table: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Test the product_images table to verify it's working
 */
export async function testProductImagesTable(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🧪 Testing product_images table...');

    // Test basic select
    const { data, error } = await supabase
      .from('product_images')
      .select('id, product_id, image_url, file_name')
      .limit(5);

    if (error) {
      throw new Error(`Select test failed: ${error.message}`);
    }

    console.log('✅ Select test passed');
    console.log('📊 Found', data?.length || 0, 'records');

    return {
      success: true,
      message: `Product images table test passed! Found ${data?.length || 0} records.`
    };

  } catch (error) {
    console.error('❌ Product images table test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
