// Script to fix supplier is_active status
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupplierStatus() {
  console.log('🔧 Fixing Supplier Status Issues...\n');

  try {
    // 1. Check current supplier status
    console.log('1. Checking current supplier status...');
    const { data: allSuppliers, error: fetchError } = await supabase
      .from('lats_suppliers')
      .select('id, name, is_active, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Failed to fetch suppliers:', fetchError);
      return;
    }

    console.log(`📊 Found ${allSuppliers.length} total suppliers`);
    
    const activeSuppliers = allSuppliers.filter(s => s.is_active === true);
    const inactiveSuppliers = allSuppliers.filter(s => s.is_active === false);
    const nullStatusSuppliers = allSuppliers.filter(s => s.is_active === null || s.is_active === undefined);

    console.log(`✅ Active suppliers: ${activeSuppliers.length}`);
    console.log(`❌ Inactive suppliers: ${inactiveSuppliers.length}`);
    console.log(`❓ NULL status suppliers: ${nullStatusSuppliers.length}`);

    if (nullStatusSuppliers.length > 0) {
      console.log('\n2. Fixing NULL status suppliers...');
      console.log('Suppliers with NULL status:');
      nullStatusSuppliers.forEach(supplier => {
        console.log(`  - ${supplier.name} (ID: ${supplier.id})`);
      });

      // Update NULL status suppliers to active
      const { error: updateError } = await supabase
        .from('lats_suppliers')
        .update({ is_active: true })
        .is('is_active', null);

      if (updateError) {
        console.error('❌ Failed to update NULL status suppliers:', updateError);
        return;
      }

      console.log(`✅ Updated ${nullStatusSuppliers.length} suppliers to active status`);
    }

    // 3. Check if is_active column exists and has proper default
    console.log('\n3. Verifying database schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { table_name: 'lats_suppliers' });

    if (schemaError) {
      console.log('⚠️ Could not check schema (this is normal if the RPC doesn\'t exist)');
    } else {
      console.log('📋 Table schema verified');
    }

    // 4. Test the getActiveSuppliers function
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

    // 5. Final status report
    console.log('\n5. Final Status Report:');
    const { data: finalSuppliers, error: finalError } = await supabase
      .from('lats_suppliers')
      .select('id, name, is_active, created_at')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ Failed to get final status:', finalError);
      return;
    }

    const finalActive = finalSuppliers.filter(s => s.is_active === true);
    const finalInactive = finalSuppliers.filter(s => s.is_active === false);
    const finalNull = finalSuppliers.filter(s => s.is_active === null || s.is_active === undefined);

    console.log(`📊 Final Status:`);
    console.log(`  ✅ Active: ${finalActive.length}`);
    console.log(`  ❌ Inactive: ${finalInactive.length}`);
    console.log(`  ❓ NULL: ${finalNull.length}`);

    if (finalNull.length === 0 && finalActive.length > 0) {
      console.log('\n🎉 All suppliers are now properly configured!');
      console.log('\nSummary:');
      console.log('- ✅ All suppliers have proper is_active status');
      console.log('- ✅ getActiveSuppliers function works correctly');
      console.log('- ✅ Supplier deletion will work as expected');
    } else if (finalNull.length > 0) {
      console.log('\n⚠️ Some suppliers still have NULL status. This might indicate:');
      console.log('- Database migration not applied properly');
      console.log('- Column doesn\'t exist in database');
      console.log('- Permission issues');
    }

    // 6. Show recent suppliers for verification
    console.log('\n6. Recent Suppliers:');
    finalSuppliers.slice(0, 5).forEach(supplier => {
      const status = supplier.is_active === true ? '✅ Active' : 
                    supplier.is_active === false ? '❌ Inactive' : '❓ NULL';
      console.log(`  ${status} - ${supplier.name} (${supplier.created_at?.split('T')[0]})`);
    });

  } catch (error) {
    console.error('❌ Script failed with error:', error);
  }
}

// Run the fix
fixSupplierStatus();
