import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use the same configuration as your app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI5NzAsImV4cCI6MjA0ODU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQLFix() {
  console.log('🔧 Executing database fix...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('fix_database_safe.sql', 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Execute each statement
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (e) {
        console.log(`⚠️  Statement ${i + 1} skipped: ${e.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Results:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    
    // Test the products table
    console.log('\n🧪 Testing products table...');
    const { data: products, error: testError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Products table test failed:', testError.message);
    } else {
      console.log('✅ Products table is working!');
    }
    
    // Test related tables
    console.log('🧪 Testing related tables...');
    const { data: categories, error: catError } = await supabase
      .from('inventory_categories')
      .select('*')
      .limit(1);
    
    if (catError) {
      console.log('❌ Categories table test failed:', catError.message);
    } else {
      console.log('✅ Categories table is working!');
    }
    
    const { data: suppliers, error: supError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(1);
    
    if (supError) {
      console.log('❌ Suppliers table test failed:', supError.message);
    } else {
      console.log('✅ Suppliers table is working!');
    }
    
    console.log('\n🎉 Database fix complete!');
    console.log('🔄 Refresh your app to see the changes');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeSQLFix(); 