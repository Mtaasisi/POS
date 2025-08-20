import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
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

async function applyProductFixMigration() {
  console.log('🔧 Applying product creation 400 error fix...');
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20241202000005_fix_product_creation_400_error.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration file loaded successfully');
    
    // Split the SQL into individual statements (excluding comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    console.log(`🔧 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For ALTER TABLE and CREATE INDEX statements, we need to use a different approach
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('UPDATE') || statement.includes('DO $$')) {
          console.log('⚠️ This statement needs to be executed manually in Supabase dashboard');
          console.log('Statement:', statement.substring(0, 100) + '...');
          continue;
        }
        
        // For simple queries, we can try using the client
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error('❌ Error executing statement:', error);
        } else {
          console.log('✅ Statement executed successfully');
        }
      } catch (error) {
        console.error('❌ Error executing statement:', error);
      }
    }

    console.log('📋 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of: supabase/migrations/20241202000005_fix_product_creation_400_error.sql');
    console.log('4. Execute the SQL');
    console.log('5. Test product creation in your app');

    // Test if the fix worked by trying to create a product
    console.log('🧪 Testing product creation...');
    
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
      console.log('💡 This means you need to apply the migration manually in Supabase dashboard');
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
      
      console.log('🎉 Product creation 400 error is now fixed!');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

// Run the migration
applyProductFixMigration();
