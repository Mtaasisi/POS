import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpareParts() {
  try {
    console.log('🔍 Testing spare parts table...');
    
    // Test 1: Check if table exists and has data
    const { data: allSpareParts, error: listError } = await supabase
      .from('spare_parts')
      .select('*')
      .limit(5);
    
    if (listError) {
      console.error('❌ Error listing spare parts:', listError);
      return;
    }
    
    console.log('✅ Spare parts table accessible');
    console.log(`📊 Found ${allSpareParts?.length || 0} spare parts`);
    
    if (allSpareParts && allSpareParts.length > 0) {
      console.log('📋 Sample spare part:', allSpareParts[0]);
    }
    
    // Test 2: Try to fetch a specific spare part by ID
    if (allSpareParts && allSpareParts.length > 0) {
      const testId = allSpareParts[0].id;
      console.log(`🔍 Testing fetch by ID: ${testId}`);
      
      const { data: specificPart, error: fetchError } = await supabase
        .from('spare_parts')
        .select('price')
        .eq('id', testId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching specific spare part:', fetchError);
      } else {
        console.log('✅ Successfully fetched specific spare part:', specificPart);
      }
    }
    
    // Test 3: Try to fetch the problematic UUID
    const problematicId = 'ef57c08f-7885-4ebf-9ce3-925050d794ae';
    console.log(`🔍 Testing problematic UUID: ${problematicId}`);
    
    const { data: problematicPart, error: problematicError } = await supabase
      .from('spare_parts')
      .select('price')
      .eq('id', problematicId)
      .single();
    
    if (problematicError) {
      console.error('❌ Error fetching problematic UUID:', problematicError);
    } else {
      console.log('✅ Successfully fetched problematic UUID:', problematicPart);
    }
    
    // Test 4: Check RLS policies
    console.log('🔍 Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'spare_parts' })
      .catch(() => ({ data: null, error: 'RPC function not available' }));
    
    if (policiesError) {
      console.log('ℹ️ Could not check RLS policies via RPC (this is normal)');
    } else {
      console.log('✅ RLS policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSpareParts(); 