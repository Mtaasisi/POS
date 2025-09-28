import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  try {
    console.log('🔍 Checking customer_checkins table schema...');
    
    // Try to get a sample record to see what columns exist
    const { data, error } = await supabase
      .from('customer_checkins')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('📋 Error details:', JSON.stringify(error, null, 2));
      
      if (error.code === 'PGRST204') {
        console.log('💡 This error usually means the table exists but has different columns than expected');
        console.log('🔧 Let me try to insert with the correct column names...');
        
        // Try with the schema from dataExportApi.ts
        const testData = {
          customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          created_by: '00000000-0000-0000-0000-000000000000', // dummy UUID
          checkin_date: new Date().toISOString(),
          notes: 'Test record'
        };
        
        console.log('🧪 Testing with schema from dataExportApi.ts...');
        console.log('📝 Test data:', testData);
        
        const { data: testInsert, error: testError } = await supabase
          .from('customer_checkins')
          .insert([testData])
          .select();
        
        if (testError) {
          console.log('❌ Still getting error with corrected schema:', JSON.stringify(testError, null, 2));
        } else {
          console.log('✅ Success with corrected schema!');
          console.log('📊 Insert result:', testInsert);
          
          // Clean up
          if (testInsert && testInsert.length > 0) {
            await supabase
              .from('customer_checkins')
              .delete()
              .eq('id', testInsert[0].id);
            console.log('🧹 Test record cleaned up');
          }
        }
      }
    } else {
      console.log('✅ Table query successful');
      console.log('📊 Sample data:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkTableSchema();
