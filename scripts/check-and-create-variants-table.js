import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check if lats_product_variants table exists and create it if needed
 */
async function checkAndCreateVariantsTable() {
  try {
    console.log('🔍 Checking if lats_product_variants table exists...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('lats_product_variants')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist or has issues:', error.message);
      console.log('🛠️ Creating lats_product_variants table...');
      
      // Create the table using SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
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
            barcode TEXT,
            weight DECIMAL(8,2),
            dimensions JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create indexes
          CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product ON lats_product_variants(product_id);
          CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
          CREATE INDEX IF NOT EXISTS idx_lats_product_variants_barcode ON lats_product_variants(barcode);
          
          -- Enable RLS
          ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
          
          -- Create RLS policies
          DROP POLICY IF EXISTS "Enable read access for all users" ON lats_product_variants;
          CREATE POLICY "Enable read access for all users" ON lats_product_variants
            FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON lats_product_variants;
          CREATE POLICY "Enable all operations for authenticated users" ON lats_product_variants
            FOR ALL USING (auth.role() = 'authenticated');
        `
      });
      
      if (createError) {
        console.error('❌ Error creating table:', createError);
        return false;
      }
      
      console.log('✅ Table created successfully!');
      return true;
    } else {
      console.log('✅ Table exists and is accessible');
      return true;
    }
  } catch (error) {
    console.error('❌ Error checking/creating table:', error);
    return false;
  }
}

/**
 * Create sample variants for existing products
 */
async function createSampleVariants() {
  try {
    console.log('🔍 Creating sample variants for existing products...');
    
    // Get existing products
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(10);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️ No products found to create variants for');
      return;
    }
    
    console.log(`📦 Found ${products.length} products, creating variants...`);
    
    // Create sample variants for each product
    for (const product of products) {
      const sampleVariant = {
        product_id: product.id,
        sku: `SKU-${product.name.toUpperCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name: 'Default Variant',
        cost_price: Math.floor(Math.random() * 50) + 10,
        selling_price: Math.floor(Math.random() * 100) + 50,
        quantity: Math.floor(Math.random() * 50) + 5,
        min_quantity: 5,
        barcode: `BAR-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };
      
      const { error: insertError } = await supabase
        .from('lats_product_variants')
        .insert(sampleVariant);
      
      if (insertError) {
        console.error(`❌ Error creating variant for product ${product.name}:`, insertError);
      } else {
        console.log(`✅ Created variant for product "${product.name}":`, {
          sku: sampleVariant.sku,
          price: sampleVariant.selling_price,
          stock: sampleVariant.quantity
        });
      }
    }
    
    console.log('✅ Sample variants creation completed');
  } catch (error) {
    console.error('❌ Error creating sample variants:', error);
  }
}

// Run the script
async function main() {
  console.log('🚀 Starting variants table check and setup...');
  
  const tableExists = await checkAndCreateVariantsTable();
  
  if (tableExists) {
    await createSampleVariants();
  }
  
  console.log('✅ Script completed');
}

main().catch(console.error);
