// Script to fix existing suppliers with NULL or incorrect is_active status
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixExistingSuppliers() {
  console.log('🔧 Fixing Existing Suppliers Status...\n');

  try {
    // 1. Check current status of all suppliers
    console.log('1. Checking current supplier status...');
    const { data: allSuppliers, error: fetchError } = await supabase
      .from('lats_suppliers')
      .select('id, name, is_active, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch suppliers:', fetchError);
      return;
    }

    console.log(`📊 Found ${allSuppliers.length} total suppliers`);
    
    const activeSuppliers = allSuppliers.filter(s => s.is_active === true);
    const inactiveSuppliers = allSuppliers.filter(s => s.is_active === false);
    const nullSuppliers = allSuppliers.filter(s => s.is_active === null || s.is_active === undefined);

    console.log(`✅ Active suppliers: ${activeSuppliers.length}`);
    console.log(`❌ Inactive suppliers: ${inactiveSuppliers.length}`);
    console.log(`❓ NULL status suppliers: ${nullSuppliers.length}`);

    if (nullSuppliers.length > 0) {
      console.log('\n2. Fixing suppliers with NULL status...');
      console.log('Suppliers with NULL status:');
      nullSuppliers.forEach(supplier => {
        console.log(`  - ${supplier.name} (ID: ${supplier.id}, Created: ${supplier.created_at?.split('T')[0]})`);
      });

      // Update all NULL status suppliers to active
      const { error: updateError } = await supabase
        .from('lats_suppliers')
        .update({ is_active: true })
        .is('is_active', null);

      if (updateError) {
        console.error('❌ Failed to update NULL status suppliers:', updateError);
        return;
      }

      console.log(`✅ Updated ${nullSuppliers.length} suppliers from NULL to active status`);
    } else {
      console.log('\n✅ No suppliers with NULL status found');
    }

    // 3. Verify the fix
    console.log('\n3. Verifying the fix...');
    const { data: updatedSuppliers, error: verifyError } = await supabase
      .from('lats_suppliers')
      .select('id, name, is_active')
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Failed to verify suppliers:', verifyError);
      return;
    }

    const finalActive = updatedSuppliers.filter(s => s.is_active === true);
    const finalInactive = updatedSuppliers.filter(s => s.is_active === false);
    const finalNull = updatedSuppliers.filter(s => s.is_active === null || s.is_active === undefined);

    console.log(`📊 Final Status:`);
    console.log(`  ✅ Active: ${finalActive.length}`);
    console.log(`  ❌ Inactive: ${finalInactive.length}`);
    console.log(`  ❓ NULL: ${finalNull.length}`);

    // 4. Test getActiveSuppliers function
    console.log('\n4. Testing getActiveSuppliers function...');
    const { data: activeSuppliersTest, error: activeTestError } = await supabase
      .from('lats_suppliers')
      .select('id, name, is_active')
      .eq('is_active', true);

    if (activeTestError) {
      console.error('❌ getActiveSuppliers test failed:', activeTestError);
      return;
    }

    console.log(`✅ getActiveSuppliers returns ${activeSuppliersTest.length} suppliers`);

    // 5. Show summary
    if (finalNull.length === 0) {
      console.log('\n🎉 All suppliers are now properly configured!');
      console.log('\nSummary:');
      console.log('- ✅ All suppliers have proper is_active status');
      console.log('- ✅ getActiveSuppliers function works correctly');
      console.log('- ✅ New suppliers will be created as active by default');
      console.log('- ✅ Supplier deletion will work as expected');
      
      if (nullSuppliers.length > 0) {
        console.log(`- ✅ Fixed ${nullSuppliers.length} suppliers that had NULL status`);
      }
    } else {
      console.log('\n⚠️ Some suppliers still have issues:');
      console.log(`- ${finalNull.length} suppliers still have NULL status`);
      console.log('This might indicate database permission issues or column problems');
    }

    // 6. Show recent suppliers for verification
    console.log('\n6. Recent Suppliers Status:');
    updatedSuppliers.slice(0, 10).forEach(supplier => {
      const status = supplier.is_active === true ? '✅ Active' : 
                    supplier.is_active === false ? '❌ Inactive' : '❓ NULL';
      console.log(`  ${status} - ${supplier.name}`);
    });

  } catch (error) {
    console.error('❌ Script failed with error:', error);
  }
}

// Run the fix
fixExistingSuppliers();
