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

async function inspectTableStructure() {
  try {
    console.log('🔍 Inspecting customer_checkins table structure...');
    
    // Try different approaches to understand the table structure
    console.log('📋 Trying to query with minimal data...');
    
    // Try to insert a record with just the primary key to see what happens
    const testInsert = {
      customer_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
    };
    
    console.log('🧪 Testing insert with minimal data:', testInsert);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('customer_checkins')
      .insert([testInsert])
      .select();
    
    if (insertError) {
      console.log('❌ Insert error:', JSON.stringify(insertError, null, 2));
      
      // Try to query the table to see what columns are available
      console.log('🔍 Trying to query existing records...');
      const { data: existingData, error: queryError } = await supabase
        .from('customer_checkins')
        .select('*')
        .limit(1);
      
      if (queryError) {
        console.log('❌ Query error:', JSON.stringify(queryError, null, 2));
      } else {
        console.log('✅ Query successful');
        console.log('📊 Existing data:', existingData);
        
        if (existingData && existingData.length > 0) {
          console.log('📋 Available columns:', Object.keys(existingData[0]));
        } else {
          console.log('📋 Table is empty, but queryable');
        }
      }
    } else {
      console.log('✅ Insert successful with minimal data!');
      console.log('📊 Insert result:', insertResult);
      
      // Clean up
      if (insertResult && insertResult.length > 0) {
        await supabase
          .from('customer_checkins')
          .delete()
          .eq('id', insertResult[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the inspection
inspectTableStructure();
