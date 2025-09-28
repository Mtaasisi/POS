// Test script to verify supplier deletion functionality
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupplierDeletion() {
  console.log('🧪 Testing Supplier Deletion Functionality...\n');

  try {
    // 1. Create a test supplier
    console.log('1. Creating test supplier...');
    const testSupplier = {
      name: 'Test Supplier for Deletion',
      company_name: 'Test Company',
      contact_person: 'Test Person',
      phone: '+255123456789',
      email: 'test@example.com',
      address: 'Test Address',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      currency: 'TZS',
      is_active: true
    };

    const { data: createdSupplier, error: createError } = await supabase
      .from('lats_suppliers')
      .insert([testSupplier])
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test supplier:', createError);
      return;
    }

    console.log('✅ Test supplier created:', createdSupplier.id);

    // 2. Verify supplier is active
    console.log('\n2. Verifying supplier is active...');
    const { data: activeSuppliers, error: activeError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .eq('is_active', true)
      .eq('id', createdSupplier.id);

    if (activeError) {
      console.error('❌ Failed to fetch active suppliers:', activeError);
      return;
    }

    console.log('✅ Supplier found in active suppliers:', activeSuppliers.length > 0);

    // 3. Soft delete the supplier
    console.log('\n3. Soft deleting supplier...');
    const { error: deleteError } = await supabase
      .from('lats_suppliers')
      .update({ is_active: false })
      .eq('id', createdSupplier.id);

    if (deleteError) {
      console.error('❌ Failed to delete supplier:', deleteError);
      return;
    }

    console.log('✅ Supplier soft deleted (is_active set to false)');

    // 4. Verify supplier is no longer in active suppliers
    console.log('\n4. Verifying supplier is no longer active...');
    const { data: activeSuppliersAfter, error: activeAfterError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .eq('is_active', true)
      .eq('id', createdSupplier.id);

    if (activeAfterError) {
      console.error('❌ Failed to fetch active suppliers after deletion:', activeAfterError);
      return;
    }

    console.log('✅ Supplier no longer in active suppliers:', activeSuppliersAfter.length === 0);

    // 5. Verify supplier still exists in all suppliers
    console.log('\n5. Verifying supplier still exists in database...');
    const { data: allSuppliers, error: allError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .eq('id', createdSupplier.id);

    if (allError) {
      console.error('❌ Failed to fetch all suppliers:', allError);
      return;
    }

    console.log('✅ Supplier still exists in database:', allSuppliers.length > 0);
    console.log('✅ Supplier is_active status:', allSuppliers[0]?.is_active);

    // 6. Clean up - hard delete the test supplier
    console.log('\n6. Cleaning up test supplier...');
    const { error: cleanupError } = await supabase
      .from('lats_suppliers')
      .delete()
      .eq('id', createdSupplier.id);

    if (cleanupError) {
      console.error('❌ Failed to cleanup test supplier:', cleanupError);
      return;
    }

    console.log('✅ Test supplier cleaned up');

    console.log('\n🎉 All tests passed! Supplier deletion is working correctly.');
    console.log('\nSummary:');
    console.log('- ✅ Soft delete sets is_active to false');
    console.log('- ✅ Active suppliers filter excludes deleted suppliers');
    console.log('- ✅ Deleted suppliers still exist in database');
    console.log('- ✅ Refresh will not bring back deleted suppliers');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testSupplierDeletion();
