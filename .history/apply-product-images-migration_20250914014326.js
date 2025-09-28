const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyProductImagesMigration() {
  console.log('🔧 Applying product_images table migration...');
  
  try {
    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('supabase/migrations/20250131000040_ensure_product_images_table.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        }
      }
    }
    
    // Test the table
    console.log('🧪 Testing product_images table...');
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error testing product_images table:', error);
    } else {
      console.log('✅ product_images table is working correctly');
    }
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyProductImagesMigration();
