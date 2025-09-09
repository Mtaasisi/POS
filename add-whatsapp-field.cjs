const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addWhatsAppField() {
  try {
    console.log('🔧 Adding WhatsApp field to customers table...');
    
    // Test if the field already exists
    console.log('1️⃣ Testing if whatsapp field exists...');
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id, name, whatsapp')
      .limit(1);
    
    if (testError && testError.message.includes('whatsapp does not exist')) {
      console.log('❌ WhatsApp field does not exist. Adding it...');
      
      // Since we can't execute DDL directly through the REST API,
      // we'll need to handle this differently
      console.log('⚠️ Cannot add columns through REST API. Please run the SQL manually:');
      console.log('ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;');
      console.log('CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);');
      
      return false;
    } else if (testError) {
      console.log('❌ Unexpected error:', testError.message);
      return false;
    } else {
      console.log('✅ WhatsApp field already exists!');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// Alternative approach: Create a function to add the field
async function createAddColumnFunction() {
  try {
    console.log('🔧 Creating function to add whatsapp field...');
    
    // This would require admin privileges, so we'll just provide the SQL
    console.log('📄 SQL to run manually:');
    console.log(`
-- Add WhatsApp field to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);

-- Update existing records to have default values
UPDATE customers 
SET whatsapp = COALESCE(whatsapp, NULL)
WHERE whatsapp IS NULL;
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting WhatsApp field fix...');
  
  const fieldExists = await addWhatsAppField();
  
  if (!fieldExists) {
    console.log('\n📋 Manual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Open the SQL editor');
    console.log('3. Run the SQL commands shown above');
    console.log('4. Test the application again');
  }
  
  console.log('🏁 WhatsApp field fix completed!');
}

main();
