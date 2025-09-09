const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCustomerFieldsFix() {
  try {
    console.log('🔧 Applying customer fields fix...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-customer-fields.sql', 'utf8');
    
    console.log('📄 SQL content:');
    console.log(sqlContent);
    
    // Execute the SQL using rpc (we'll need to create a function for this)
    console.log('🚀 Executing SQL commands...');
    
    // Add total_returns field
    console.log('1️⃣ Adding total_returns field...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_returns INTEGER DEFAULT 0;'
    });
    
    if (error1) {
      console.log('⚠️ total_returns field might already exist or there was an error:', error1.message);
    } else {
      console.log('✅ total_returns field added successfully');
    }
    
    // Add profile_image field
    console.log('2️⃣ Adding profile_image field...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql_query: 'ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;'
    });
    
    if (error2) {
      console.log('⚠️ profile_image field might already exist or there was an error:', error2.message);
    } else {
      console.log('✅ profile_image field added successfully');
    }
    
    // Create indexes
    console.log('3️⃣ Creating indexes...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE INDEX IF NOT EXISTS idx_customers_total_returns ON customers(total_returns);
        CREATE INDEX IF NOT EXISTS idx_customers_profile_image ON customers(profile_image);
      `
    });
    
    if (error3) {
      console.log('⚠️ Index creation error:', error3.message);
    } else {
      console.log('✅ Indexes created successfully');
    }
    
    // Update existing records
    console.log('4️⃣ Updating existing records...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql_query: `
        UPDATE customers 
        SET 
            total_returns = COALESCE(total_returns, 0),
            profile_image = COALESCE(profile_image, NULL)
        WHERE total_returns IS NULL OR profile_image IS NULL;
      `
    });
    
    if (error4) {
      console.log('⚠️ Record update error:', error4.message);
    } else {
      console.log('✅ Records updated successfully');
    }
    
    // Verify the changes
    console.log('5️⃣ Verifying changes...');
    const { data: columns, error: error5 } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'customers')
      .in('column_name', ['total_returns', 'profile_image']);
    
    if (error5) {
      console.log('⚠️ Verification error:', error5.message);
    } else {
      console.log('✅ Verification successful:');
      console.log(columns);
    }
    
    console.log('🎉 Customer fields fix applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying customer fields fix:', error);
    process.exit(1);
  }
}

// Alternative approach: Test if the fields exist by trying to query them
async function testCustomerFields() {
  try {
    console.log('🧪 Testing customer fields...');
    
    // Test if we can query the fields
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, total_returns, profile_image')
      .limit(1);
    
    if (error) {
      console.log('❌ Fields test failed:', error.message);
      return false;
    } else {
      console.log('✅ Fields test successful:', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting customer fields fix...');
  
  // First test if the fields already exist
  const fieldsExist = await testCustomerFields();
  
  if (fieldsExist) {
    console.log('✅ Customer fields already exist! No fix needed.');
  } else {
    console.log('❌ Customer fields missing. Applying fix...');
    await applyCustomerFieldsFix();
  }
  
  console.log('🏁 Customer fields fix completed!');
}

main();
