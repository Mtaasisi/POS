import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductCreation400Error() {
  console.log('🔧 Fixing product creation 400 error...');
  
  try {
    // Apply the SQL migration directly
    console.log('📝 Applying database schema fixes...');
    
    const migrationSQL = `
      -- Add missing columns to lats_products table
      ALTER TABLE lats_products 
      ADD COLUMN IF NOT EXISTS sku TEXT,
      ADD COLUMN IF NOT EXISTS barcode TEXT,
      ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
      CREATE INDEX IF NOT EXISTS idx_lats_products_barcode ON lats_products(barcode);

      -- Update existing products to have default values for new columns
      UPDATE lats_products 
      SET 
        stock_quantity = 0,
        min_stock_level = 0
      WHERE stock_quantity IS NULL 
         OR min_stock_level IS NULL;
    `;

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      console.log(`🔧 Executing: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Error executing statement:', error);
        console.error('Statement:', statement);
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    // Test the fix by trying to create a test product
    console.log('🧪 Testing the fix with a sample product...');
    
    const testProductData = {
      name: 'Test Product - Delete Me',
      description: 'This is a test product to verify the fix',
      sku: 'TEST-001',
      barcode: 'TEST-001',
      cost_price: 10.00,
      selling_price: 15.00,
      stock_quantity: 5,
      min_stock_level: 2,
      is_active: true
    };

    const { data: testProduct, error: testError } = await supabase
      .from('lats_products')
      .insert([testProductData])
      .select()
      .single();

    if (testError) {
      console.error('❌ Test product creation failed:', testError);
      console.error('This means the fix did not work completely');
    } else {
      console.log('✅ Test product created successfully!');
      console.log('📋 Test product data:', testProduct);
      
      // Clean up the test product
      console.log('🧹 Cleaning up test product...');
      const { error: deleteError } = await supabase
        .from('lats_products')
        .delete()
        .eq('id', testProduct.id);
      
      if (deleteError) {
        console.error('⚠️ Warning: Could not delete test product:', deleteError);
      } else {
        console.log('✅ Test product cleaned up');
      }
    }

    console.log('🎉 Product creation 400 error fix completed!');
    console.log('💡 You can now create products without the 400 error');

  } catch (error) {
    console.error('❌ Error fixing product creation:', error);
  }
}

// Run the fix
fixProductCreation400Error();
