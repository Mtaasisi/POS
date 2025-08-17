import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixProductVariants400Error() {
  console.log('🔧 Fixing LATS Product Variants 400 Error...\n');

  try {
    // Step 1: Check if the table exists
    console.log('📋 Step 1: Checking if lats_product_variants table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('lats_product_variants')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      console.log('🔧 This suggests the table needs to be created or RLS needs to be fixed');
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // Step 2: Test the specific query that's failing
    console.log('\n📋 Step 2: Testing the duplicate SKU check query...');
    const testSkus = ['LAP-ESR-2888-VARIANT'];
    
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('lats_product_variants')
      .select('sku')
      .in('sku', testSkus);
    
    if (duplicateError) {
      console.log('❌ Duplicate SKU check failed:', duplicateError.message);
      console.log('🔧 This is the exact error causing the 400 Bad Request');
    } else {
      console.log('✅ Duplicate SKU check works');
      console.log('📊 Found variants:', duplicateCheck?.length || 0);
    }

    // Step 3: Check RLS policies
    console.log('\n📋 Step 3: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .limit(1);
    
    if (policiesError) {
      console.log('❌ RLS policy issue:', policiesError.message);
    } else {
      console.log('✅ RLS policies are working');
    }

    // Step 4: Try to create a test variant to see if the issue is with creation
    console.log('\n📋 Step 4: Testing variant creation...');
    const testVariant = {
      product_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      sku: `TEST-SKU-${Date.now()}`
    };
    
    const { data: newVariant, error: createError } = await supabase
      .from('lats_product_variants')
      .insert(testVariant)
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Variant creation failed:', createError.message);
      console.log('📋 Error details:', createError);
    } else {
      console.log('✅ Variant creation works');
      console.log('📦 Created variant:', newVariant.id);
      
      // Clean up test data
      await supabase.from('lats_product_variants').delete().eq('id', newVariant.id);
      console.log('🧹 Test data cleaned up');
    }

    // Step 5: Provide recommendations
    console.log('\n📋 Step 5: Recommendations...');
    console.log('🔧 If the table doesn\'t exist or has RLS issues, run the comprehensive fix:');
    console.log('   node scripts/fix-lats-400-error-comprehensive.js');
    console.log('');
    console.log('🔧 If the issue persists, check the database schema:');
    console.log('   - Ensure lats_product_variants table exists');
    console.log('   - Ensure RLS policies are properly configured');
    console.log('   - Ensure the user has proper permissions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixProductVariants400Error();
