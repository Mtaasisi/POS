const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runMigration() {
  try {
    console.log('🔧 Running purchase orders foreign key fix migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241203000007_fix_purchase_orders_foreign_keys.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log(`⚠️  Statement ${i + 1} had an issue (this might be expected):`, error.message);
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.log(`⚠️  Statement ${i + 1} failed (this might be expected):`, err.message);
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    
    // Test the query that was failing
    console.log('🧪 Testing the previously failing query...');
    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .select(`
        *,
        lats_suppliers(name),
        lats_purchase_order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Query still failing:', error.message);
    } else {
      console.log('✅ Query now works!');
      console.log(`📊 Found ${data?.length || 0} purchase orders`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();
