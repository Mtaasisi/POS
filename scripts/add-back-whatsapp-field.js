import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBackWhatsAppField() {
  console.log('🔧 Adding back WhatsApp field to customers table...');
  console.log('📋 This will restore the WhatsApp field that was previously removed\n');

  try {
    // Try to add the column directly using Supabase client
    console.log('1️⃣ Attempting to add WhatsApp column directly...');
    
    // First, check if the column already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('whatsapp')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ WhatsApp column already exists!');
      console.log('📊 Testing WhatsApp field access...');
      return await testWhatsAppField();
    }
    
    console.log('2️⃣ WhatsApp column does not exist, adding it...');
    
    // Since we can't execute DDL through the REST API, let's show the migration SQL
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241208000000_add_back_whatsapp_to_customers.sql');
    
    if (fs.existsSync(migrationPath)) {
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      console.log('\n📋 Please apply this migration manually using one of these methods:');
      console.log('\n1. Supabase Dashboard:');
      console.log('   - Go to your Supabase project dashboard');
      console.log('   - Navigate to SQL Editor');
      console.log('   - Copy and paste the SQL below');
      console.log('   - Execute the SQL');
      console.log('\n2. Supabase CLI:');
      console.log('   - Run: supabase db push');
      console.log('\n📋 SQL to execute:');
      console.log('='.repeat(80));
      console.log(migrationSQL);
      console.log('='.repeat(80));
    } else {
      console.error('❌ Migration file not found:', migrationPath);
    }

  } catch (error) {
    console.error('💥 Operation failed:', error);
  }
}

async function testWhatsAppField() {
  console.log('🧪 Testing WhatsApp field...');
  
  try {
    // Test querying the WhatsApp field
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, whatsapp')
      .limit(5);
    
    if (error) {
      console.error('❌ Test query failed:', error);
      return false;
    } else {
      console.log('✅ WhatsApp field is accessible!');
      console.log(`📊 Retrieved ${data?.length || 0} customers with WhatsApp field`);
      
      if (data && data.length > 0) {
        console.log('📋 Sample data:');
        data.forEach((customer, index) => {
          console.log(`   ${index + 1}. ${customer.name}: ${customer.whatsapp || 'No WhatsApp'}`);
        });
      }
      return true;
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return false;
  }
}

// Run the operation
addBackWhatsAppField().then(() => {
  console.log('\n🏁 Operation completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Operation failed:', error);
  process.exit(1);
});
