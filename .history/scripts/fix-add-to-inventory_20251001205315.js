import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Use the same configuration as the main app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAddToInventoryFunction() {
  console.log('🚀 Fixing add_quality_checked_items_to_inventory function...');
  
  try {
    // Test the current function first
    console.log('🔍 Testing current function...');
    const testResult = await supabase.rpc('add_quality_checked_items_to_inventory', { 
      p_quality_check_id: '00000000-0000-0000-0000-000000000000',
      p_purchase_order_id: '00000000-0000-0000-0000-000000000000',
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_profit_margin_percentage: 30,
      p_default_location: 'test'
    });
    
    if (testResult.error) {
      console.log('❌ Function test failed (expected):', testResult.error.message);
      
      console.log('🔧 Parameter mismatch detected!');
      console.log('');
      console.log('📋 Manual Fix Required:');
      console.log('Please run the following SQL in your Supabase dashboard:');
      console.log('');
      
      // Read the SQL file
      const sqlPath = path.join(process.cwd(), 'FIX_ADD_TO_INVENTORY_FUNCTION.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      console.log('-- Copy and paste this into Supabase SQL Editor:');
      console.log(sql);
      console.log('');
      console.log('🎯 This will fix the parameter mismatch causing the inventory addition to fail.');
    } else {
      console.log('✅ Function already exists and working:', testResult.data);
    }
    
  } catch (error) {
    console.error('❌ Fix attempt failed:', error.message);
    console.log('');
    console.log('📋 Manual Fix Required:');
    console.log('Please run the following SQL in your Supabase dashboard:');
    console.log('');
    
    const sqlPath = path.join(process.cwd(), 'FIX_ADD_TO_INVENTORY_FUNCTION.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('-- Copy and paste this into Supabase SQL Editor:');
    console.log(sql);
  }
}

fixAddToInventoryFunction();
