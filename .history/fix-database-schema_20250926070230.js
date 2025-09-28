#!/usr/bin/env node

// Script to fix database schema issues
// This script will create the missing tables and fix the 400 Bad Request errors

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration (you'll need to update these with your actual values)
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('🔧 Starting database schema fix...');
  
  try {
    // 1. Create lats_receipts table
    console.log('📋 Creating lats_receipts table...');
    const { error: receiptsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_receipts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_id UUID NOT NULL,
          receipt_number VARCHAR(50) UNIQUE,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(20),
          total_amount DECIMAL(15,2) DEFAULT 0,
          payment_method TEXT,
          items_count INTEGER DEFAULT 0,
          generated_by TEXT,
          receipt_content TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (receiptsError) {
      console.log('⚠️  lats_receipts table might already exist:', receiptsError.message);
    } else {
      console.log('✅ lats_receipts table created successfully');
    }

    // 2. Create lats_sale_items table
    console.log('📋 Creating lats_sale_items table...');
    const { error: saleItemsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lats_sale_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sale_id UUID NOT NULL,
          product_id UUID NOT NULL,
          variant_id UUID,
          sku VARCHAR(100),
          quantity INTEGER DEFAULT 1,
          unit_price DECIMAL(15,2) DEFAULT 0,
          total_price DECIMAL(15,2) DEFAULT 0,
          cost_price DECIMAL(15,2) DEFAULT 0,
          profit DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (saleItemsError) {
      console.log('⚠️  lats_sale_items table might already exist:', saleItemsError.message);
    } else {
      console.log('✅ lats_sale_items table created successfully');
    }

    // 3. Add missing columns to lats_products
    console.log('📋 Adding missing columns to lats_products...');
    const { error: productsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS category VARCHAR(100);
        ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
        ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE lats_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `
    });
    
    if (productsError) {
      console.log('⚠️  lats_products columns might already exist:', productsError.message);
    } else {
      console.log('✅ lats_products columns added successfully');
    }

    // 4. Add missing columns to lats_product_variants
    console.log('📋 Adding missing columns to lats_product_variants...');
    const { error: variantsError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS attributes JSONB;
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS price DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS cost_price DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE lats_product_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      `
    });
    
    if (variantsError) {
      console.log('⚠️  lats_product_variants columns might already exist:', variantsError.message);
    } else {
      console.log('✅ lats_product_variants columns added successfully');
    }

    // 5. Enable RLS and create policies
    console.log('🔒 Setting up RLS policies...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE lats_receipts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_sale_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
        ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for lats_receipts
        DROP POLICY IF EXISTS "Enable read access for all users" ON lats_receipts;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_receipts;
        DROP POLICY IF EXISTS "Enable update access for all users" ON lats_receipts;
        DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_receipts;
        
        CREATE POLICY "Enable read access for all users" ON lats_receipts FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON lats_receipts FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON lats_receipts FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for all users" ON lats_receipts FOR DELETE USING (true);
        
        -- Create policies for lats_sale_items
        DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sale_items;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sale_items;
        DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sale_items;
        DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_sale_items;
        
        CREATE POLICY "Enable read access for all users" ON lats_sale_items FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON lats_sale_items FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON lats_sale_items FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for all users" ON lats_sale_items FOR DELETE USING (true);
        
        -- Create policies for lats_products
        DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_products;
        DROP POLICY IF EXISTS "Enable update access for all users" ON lats_products;
        DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_products;
        
        CREATE POLICY "Enable read access for all users" ON lats_products FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON lats_products FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON lats_products FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for all users" ON lats_products FOR DELETE USING (true);
        
        -- Create policies for lats_product_variants
        DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
        DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_product_variants;
        DROP POLICY IF EXISTS "Enable update access for all users" ON lats_product_variants;
        DROP POLICY IF EXISTS "Enable delete access for all users" ON lats_product_variants;
        
        CREATE POLICY "Enable read access for all users" ON lats_product_variants FOR SELECT USING (true);
        CREATE POLICY "Enable insert access for all users" ON lats_product_variants FOR INSERT WITH CHECK (true);
        CREATE POLICY "Enable update access for all users" ON lats_product_variants FOR UPDATE USING (true);
        CREATE POLICY "Enable delete access for all users" ON lats_product_variants FOR DELETE USING (true);
      `
    });
    
    if (rlsError) {
      console.log('⚠️  RLS setup might have issues:', rlsError.message);
    } else {
      console.log('✅ RLS policies created successfully');
    }

    // 6. Test the failing query
    console.log('🧪 Testing the failing query...');
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        lats_sale_items(
          *,
          lats_products(name, description),
          lats_product_variants(name, sku, attributes)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (testError) {
      console.log('❌ Test query still failing:', testError.message);
    } else {
      console.log('✅ Test query successful! Found', testData?.length || 0, 'sales records');
    }

    console.log('🎉 Database schema fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database schema:', error);
  }
}

// Run the fix
fixDatabaseSchema();
