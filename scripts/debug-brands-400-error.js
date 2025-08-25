import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugBrandsError() {
  console.log('🔍 Debugging brands 400 error...');
  console.log('🔍 Supabase URL:', supabaseUrl);
  console.log('🔍 Anon Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
  
  try {
    // Test 1: Basic select
    console.log('\n📋 Test 1: Basic select with *');
    const { data: data1, error: error1 } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(1);
      
    if (error1) {
      console.error('❌ Test 1 failed:', error1);
    } else {
      console.log('✅ Test 1 passed:', data1?.length || 0, 'records');
    }
    
    // Test 2: Explicit columns
    console.log('\n📋 Test 2: Explicit column selection');
    const { data: data2, error: error2 } = await supabase
      .from('lats_brands')
      .select('id, name, description')
      .limit(1);
      
    if (error2) {
      console.error('❌ Test 2 failed:', error2);
    } else {
      console.log('✅ Test 2 passed:', data2?.length || 0, 'records');
    }
    
    // Test 3: Check table structure
    console.log('\n📋 Test 3: Check table structure');
    const { data: structure, error: structureError } = await supabase
      .rpc('get_table_structure', { table_name: 'lats_brands' });
      
    if (structureError) {
      console.error('❌ Test 3 failed:', structureError);
    } else {
      console.log('✅ Test 3 passed, table structure:', structure);
    }
    
    // Test 4: Check RLS policies
    console.log('\n📋 Test 4: Check RLS policies');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'lats_brands');
      
    if (policiesError) {
      console.error('❌ Test 4 failed:', policiesError);
    } else {
      console.log('✅ Test 4 passed, RLS policies:', policies?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugBrandsError().then(() => {
  console.log('\n🔍 Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
