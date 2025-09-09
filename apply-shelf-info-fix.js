const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyShelfInfoFix() {
  try {
    console.log('🔧 Applying product_shelf_info view fix...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-product-shelf-info-view.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL to execute:');
    console.log(sql);
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      
      // Try alternative approach using direct query
      console.log('🔄 Trying alternative approach...');
      
      const queries = sql.split(';').filter(q => q.trim());
      
      for (const query of queries) {
        if (query.trim()) {
          console.log('Executing:', query.trim());
          const { error: queryError } = await supabase.rpc('exec_sql', { sql: query.trim() });
          if (queryError) {
            console.warn('⚠️ Query failed:', queryError.message);
          } else {
            console.log('✅ Query executed successfully');
          }
        }
      }
    } else {
      console.log('✅ product_shelf_info view created successfully');
    }
    
    // Test the view
    console.log('🧪 Testing the new view...');
    const { data: testData, error: testError } = await supabase
      .from('product_shelf_info')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ View test failed:', testError);
    } else {
      console.log('✅ View test successful, found', testData?.length || 0, 'records');
      if (testData && testData.length > 0) {
        console.log('📋 Sample data:', testData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

// Run the fix
applyShelfInfoFix().then(() => {
  console.log('🏁 Fix application completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
