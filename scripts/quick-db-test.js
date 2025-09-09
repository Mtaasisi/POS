// Quick database test - run this in browser console
// Copy and paste this into your browser console on the app page

async function quickDbTest() {
  console.log('🔍 Quick database test...');
  
  try {
    // Test 1: Check if we can access the supabase client
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase client found');
    } else {
      console.log('❌ Supabase client not found');
      return;
    }

    // Test 2: Try to query the shipping agents table directly
    console.log('📊 Testing direct table query...');
    const { data, error } = await window.supabase
      .from('lats_shipping_agents')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Table query error:', error);
      
      // Test 3: Check if the view exists
      console.log('📊 Testing view query...');
      const { data: viewData, error: viewError } = await window.supabase
        .from('lats_shipping_agents_with_offices')
        .select('*')
        .limit(5);

      if (viewError) {
        console.error('❌ View query error:', viewError);
        console.log('💡 Both table and view are missing. You need to run the migration.');
      } else {
        console.log('✅ View exists with data:', viewData);
      }
    } else {
      console.log('✅ Table exists with data:', data);
    }

    // Test 4: Check table structure
    console.log('📊 Testing table structure...');
    const { data: structureData, error: structureError } = await window.supabase
      .from('lats_shipping_agents')
      .select('id, name, company, is_active, created_at')
      .limit(1);

    if (structureError) {
      console.error('❌ Structure test error:', structureError);
    } else {
      console.log('✅ Table structure is correct:', structureData);
    }

  } catch (error) {
    console.error('❌ Exception during test:', error);
  }
}

// Run the test
quickDbTest();
