import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the same configuration as the main app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReceivedItemsRPC() {
  console.log('🚀 Attempting to fix get_received_items_for_po RPC function...');
  
  try {
    // Test the current function first
    console.log('🔍 Testing current function...');
    const testResult = await supabase.rpc('get_received_items_for_po', { 
      po_id: 'b446a1f3-0463-48d3-bc64-ca25a0e65024' 
    });
    
    if (testResult.error) {
      console.log('❌ Function test failed (expected):', testResult.error.message);
      
      // Try to create the function using a different approach
      console.log('🔧 Attempting to create function via SQL execution...');
      
      // Read the SQL file
      const sqlPath = path.join(process.cwd(), 'FIX_GET_RECEIVED_ITEMS_RPC_CORRECTED.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Try to execute via RPC (this might not work with anon key)
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.log('❌ SQL execution failed:', error.message);
        console.log('');
        console.log('📋 Manual Fix Required:');
        console.log('Please run the following SQL in your Supabase dashboard:');
        console.log('');
        console.log('-- Copy and paste this into Supabase SQL Editor:');
        console.log(sql);
        console.log('');
        console.log('🎯 This will fix the 404 error you are seeing in the console logs.');
      } else {
        console.log('✅ Function created successfully!');
      }
    } else {
      console.log('✅ Function already exists and working:', testResult.data);
    }
    
  } catch (error) {
    console.error('❌ Fix attempt failed:', error.message);
    console.log('');
    console.log('📋 Manual Fix Required:');
    console.log('Please run the following SQL in your Supabase dashboard:');
    console.log('');
    
    const sqlPath = path.join(process.cwd(), 'FIX_GET_RECEIVED_ITEMS_RPC_CORRECTED.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('-- Copy and paste this into Supabase SQL Editor:');
    console.log(sql);
  }
}

fixReceivedItemsRPC();
