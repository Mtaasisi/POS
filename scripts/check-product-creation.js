import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProductCreation() {
  console.log('🔍 Checking product creation and RLS policies...\n');
  
  try {
    // 1. Check if we can access the lats_products table
    console.log('1️⃣ Testing basic table access...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (productsError) {
      console.error('❌ Error accessing lats_products table:', productsError);
      console.error('Error details:', {
        code: productsError.code,
        message: productsError.message,
        details: productsError.details,
        hint: productsError.hint
      });
      
      if (productsError.code === 'PGRST116') {
        console.log('🔒 This is an RLS (Row Level Security) policy violation');
        console.log('💡 The user might not have proper permissions to access the table');
      }
    } else {
      console.log(`✅ Successfully accessed lats_products table`);
      console.log(`📊 Found ${products?.length || 0} products`);
      
      if (products && products.length > 0) {
        console.log('\n📋 Recent products:');
        products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.name} (ID: ${product.id}) - Created: ${product.created_at}`);
        });
      }
    }

    // 2. Check RLS policies
    console.log('\n2️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'lats_products' })
      .catch(() => ({ data: null, error: { message: 'Function not available' } }));

    if (policiesError) {
      console.log('⚠️ Could not check RLS policies directly');
      console.log('💡 You can check RLS policies in Supabase Dashboard:');
      console.log('   - Go to Authentication > Policies');
      console.log('   - Look for lats_products table');
    } else {
      console.log('✅ RLS policies found:', policies);
    }

    // 3. Test product insertion
    console.log('\n3️⃣ Testing product insertion...');
    const testProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product for debugging',
      category_id: null,
      is_active: true,
      total_quantity: 0,
      total_value: 0
    };

    const { data: insertedProduct, error: insertError } = await supabase
      .from('lats_products')
      .insert(testProduct)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test product:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      if (insertError.code === 'PGRST116') {
        console.log('🔒 RLS policy prevents insertion');
        console.log('💡 Check if the user has INSERT permissions');
      }
    } else {
      console.log('✅ Successfully inserted test product:', insertedProduct);
      
      // Clean up test product
      const { error: deleteError } = await supabase
        .from('lats_products')
        .delete()
        .eq('id', insertedProduct.id);
      
      if (deleteError) {
        console.log('⚠️ Could not delete test product:', deleteError.message);
      } else {
        console.log('🧹 Test product cleaned up');
      }
    }

    // 4. Check authentication status
    console.log('\n4️⃣ Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
    } else if (user) {
      console.log('✅ User is authenticated:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('⚠️ No authenticated user found');
      console.log('💡 This might be why RLS policies are blocking access');
    }

    // 5. Check if there are any products with the specific ID from the logs
    console.log('\n5️⃣ Checking for specific product ID...');
    const specificProductId = '9a10fdf2-e022-4618-9254-72d94c94a7a4'; // From your logs
    
    const { data: specificProduct, error: specificError } = await supabase
      .from('lats_products')
      .select('*')
      .eq('id', specificProductId)
      .single();

    if (specificError) {
      console.log('❌ Could not find product with ID:', specificProductId);
      console.log('Error:', specificError.message);
    } else {
      console.log('✅ Found the specific product:', specificProduct);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProductCreation().then(() => {
  console.log('\n🏁 Check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
