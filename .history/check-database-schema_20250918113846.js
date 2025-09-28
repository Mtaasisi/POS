import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');
  
  try {
    // Try to get one customer record to see what columns exist
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying customers table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Customers table exists with columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('📝 Customers table exists but is empty');
      
      // Try to insert a test record to see what columns are available
      const testCustomer = {
        name: 'Test Customer',
        phone: '+255123456789',
        email: null
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert([testCustomer])
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error inserting test customer:', insertError.message);
      } else {
        console.log('✅ Successfully inserted test customer with columns:');
        const columns = Object.keys(insertData);
        columns.forEach(col => console.log(`  - ${col}`));
        
        // Clean up test record
        await supabase.from('customers').delete().eq('id', insertData.id);
        console.log('🧹 Cleaned up test record');
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

checkDatabaseSchema();
