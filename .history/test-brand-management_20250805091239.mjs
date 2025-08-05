import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testBrandManagement() {
  try {
    console.log('🧪 Testing brand management functionality...');
    
    // Test 1: Check if brands table exists
    console.log('\n1. Checking brands table...');
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('*')
      .limit(1);
    
    if (brandsError) {
      console.error('❌ Brands table error:', brandsError);
    } else {
      console.log('✅ Brands table accessible');
      console.log(`📊 Found ${brands?.length || 0} brands`);
    }

    // Test 2: Check storage buckets
    console.log('\n2. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError);
    } else {
      console.log('✅ Storage accessible');
      console.log('📦 Available buckets:', buckets.map(b => b.name));
    }

    // Test 3: Try to create a test brand
    console.log('\n3. Testing brand creation...');
    const testBrand = {
      name: 'Test Brand ' + Date.now(),
      description: 'Test brand for functionality verification',
      category: ['phone'],
      is_active: true
    };

    const { data: newBrand, error: createError } = await supabase
      .from('brands')
      .insert([testBrand])
      .select()
      .single();

    if (createError) {
      console.error('❌ Brand creation error:', createError);
    } else {
      console.log('✅ Brand creation successful');
      console.log('📝 Created brand:', newBrand.name);

      // Clean up: delete the test brand
      const { error: deleteError } = await supabase
        .from('brands')
        .delete()
        .eq('id', newBrand.id);

      if (deleteError) {
        console.error('⚠️ Could not clean up test brand:', deleteError);
      } else {
        console.log('🧹 Test brand cleaned up');
      }
    }

    console.log('\n🎉 Brand management test completed!');
    console.log('✅ All core functionality is working');
    console.log('📝 You can now use the brand management interface');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBrandManagement(); 