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

async function applyRepairPartsStatusFix() {
  console.log('🔧 Applying repair parts status fix...');
  
  try {
    // Read the SQL fix file
    const sqlFilePath = path.join(__dirname, 'fix-repair-parts-status.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim() === '') continue;
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          if (data) {
            console.log('   Result:', data);
          }
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Repair parts status fix applied successfully!');
      
      // Test the fix by checking repair parts status
      console.log('\n🔍 Testing the fix...');
      
      const { data: testData, error: testError } = await supabase
        .from('repair_parts')
        .select('status')
        .limit(10);
      
      if (testError) {
        console.error('❌ Test query failed:', testError.message);
      } else {
        console.log('✅ Test query successful');
        console.log('   Sample repair parts statuses:', testData?.map(p => p.status));
      }
      
    } else {
      console.log('\n⚠️ Some statements failed. Please check the errors above.');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply repair parts status fix:', error.message);
    process.exit(1);
  }
}

// Run the fix
applyRepairPartsStatusFix()
  .then(() => {
    console.log('\n✅ Repair parts status fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Repair parts status fix failed:', error.message);
    process.exit(1);
  });
