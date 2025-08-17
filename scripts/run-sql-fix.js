import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runSqlFix() {
  console.log('🔧 Running SQL fix for lats_product_variants table...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'fix-product-variants-simple.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📋 SQL file loaded successfully');
    console.log('📏 SQL content length:', sqlContent.length, 'characters');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n📋 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // For SELECT statements, we need to handle them differently
        if (statement.trim().toUpperCase().startsWith('SELECT')) {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log('⚠️ SELECT statement error (may not have exec_sql function):', error.message);
          } else {
            console.log('✅ SELECT statement executed');
            if (data && data.length > 0) {
              console.log('📊 Results:', data.slice(0, 3)); // Show first 3 results
            }
          }
        } else {
          // For other statements, try to execute them
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log('⚠️ Statement error (may not have exec_sql function):', error.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        }
      } catch (err) {
        console.log('❌ Statement execution failed:', err.message);
      }
    }

    // Test the fix
    console.log('\n📋 Testing the fix...');
    
    // Test the duplicate SKU check query that was failing
    const testSkus = ['LAP-ESR-2888-VARIANT'];
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('lats_product_variants')
      .select('sku, name')
      .in('sku', testSkus);
    
    if (duplicateError) {
      console.log('❌ Duplicate SKU check still failing:', duplicateError.message);
    } else {
      console.log('✅ Duplicate SKU check now works!');
      console.log('📊 Found variants:', duplicateCheck?.length || 0);
    }

    // Test variant creation
    const testVariant = {
      product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      sku: `TEST-SKU-${Date.now()}`,
      name: 'Test Variant',
      cost_price: 10.00,
      selling_price: 15.00,
      quantity: 5
    };
    
    const { data: newVariant, error: createError } = await supabase
      .from('lats_product_variants')
      .insert(testVariant)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Variant creation still failing:', createError.message);
    } else {
      console.log('✅ Variant creation now works!');
      console.log('📦 Created variant:', newVariant.id);
      
      // Clean up test data
      await supabase.from('lats_product_variants').delete().eq('id', newVariant.id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 SQL fix completed!');
    console.log('📋 If the table still has issues, you may need to run the SQL manually in your Supabase dashboard.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

runSqlFix();
