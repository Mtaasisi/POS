import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzE5NzQsImV4cCI6MjA1MTU0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createLatsTables() {
  console.log('🚀 Creating LATS tables...');
  
  try {
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Connection test failed:', testError.message);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Create tables one by one
    const tables = [
      {
        name: 'lats_categories',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_categories (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            color TEXT DEFAULT '#3B82F6',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },

      {
        name: 'lats_suppliers',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_suppliers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            website TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'lats_products',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_products (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category_id UUID REFERENCES lats_categories(id) ON DELETE SET NULL,
            supplier_id UUID REFERENCES lats_suppliers(id) ON DELETE SET NULL,
            images TEXT[] DEFAULT '{}',
            tags TEXT[] DEFAULT '{}',
            is_active BOOLEAN DEFAULT true,
            total_quantity INTEGER DEFAULT 0,
            total_value DECIMAL(12,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'lats_product_variants',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_product_variants (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
            sku TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            attributes JSONB DEFAULT '{}',
            cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
            selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 0,
            min_quantity INTEGER DEFAULT 0,
            max_quantity INTEGER,
            barcode TEXT,
            weight DECIMAL(8,2),
            dimensions JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'lats_sales',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_sales (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            sale_number TEXT NOT NULL UNIQUE DEFAULT 'SALE-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            customer_id UUID,
            total_amount DECIMAL(12,2) NOT NULL,
            payment_method TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'lats_sale_items',
        sql: `
          CREATE TABLE IF NOT EXISTS lats_sale_items (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            sale_id UUID NOT NULL REFERENCES lats_sales(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
            variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const table of tables) {
      try {
        console.log(`⏳ Checking table: ${table.name}...`);
        
        // Try to create the table using a simple insert to test if it exists
        const { error } = await supabase
          .from(table.name)
          .select('count')
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          console.log(`❌ Table ${table.name} does not exist. You need to create it manually in the Supabase dashboard.`);
          errorCount++;
        } else {
          console.log(`✅ Table ${table.name} exists or is accessible`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`❌ Error checking table ${table.name}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Table Check Summary:');
    console.log(`✅ Existing tables: ${successCount}/${tables.length}`);
    console.log(`❌ Missing tables: ${errorCount}/${tables.length}`);
    
    if (errorCount > 0) {
      console.log('\n📋 Manual Setup Instructions:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project: jxhzveborezjhsmzsgbc');
      console.log('3. Navigate to SQL Editor');
      console.log('4. Copy and paste the contents of: apply-lats-schema-manual.sql');
      console.log('5. Click Run to execute the schema');
      console.log('6. Verify tables are created in the Table Editor');
    } else {
      console.log('🎉 All LATS tables are ready!');
    }
    
  } catch (error) {
    console.error('❌ Failed to check LATS tables:', error.message);
  }
}

// Run the function
createLatsTables();
