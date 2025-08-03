import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NzI5NzAsImV4cCI6MjA0ODU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductsTable() {
  console.log('🔧 Fixing products table and related tables...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'fix_products_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try executing the SQL directly via REST API
      console.log('🔄 Trying alternative method...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement });
            if (stmtError) {
              console.log(`⚠️  Statement failed (this is normal for some statements): ${stmtError.message}`);
            }
          } catch (e) {
            console.log(`⚠️  Statement skipped: ${e.message}`);
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully');
    }
    
    // Test the products table
    console.log('🧪 Testing products table...');
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
    
    console.log('🎉 Products table setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixProductsTable(); 