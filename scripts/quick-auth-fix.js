import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function quickAuthFix() {
  console.log('🔧 Quick Authentication Fix for LATS 400 Error\n');
  
  try {
    // Step 1: Check current auth status
    console.log('1️⃣ Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ No active session found');
      console.log('   Error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
      console.log('   User ID:', user.id);
      
      // Test LATS products access
      console.log('\n2️⃣ Testing LATS products access...');
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('*')
        .limit(1);
      
      if (productsError) {
        console.log('❌ Still getting error:', productsError.message);
      } else {
        console.log('✅ LATS products accessible!');
        console.log('   Found', products?.length || 0, 'products');
        return;
      }
    } else {
      console.log('ℹ️ No user authenticated');
    }

    // Step 2: Try to sign in with test credentials
    console.log('\n2️⃣ Attempting to sign in with test credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('\n📋 SOLUTION: Create a test user account');
        console.log('   1. Go to Supabase Dashboard > Authentication > Users');
        console.log('   2. Click "Add User"');
        console.log('   3. Enter:');
        console.log('      Email: test@example.com');
        console.log('      Password: password123');
        console.log('   4. Click "Create User"');
        console.log('   5. Run this script again');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('   User:', signInData.user.email);
      
      // Test LATS access again
      console.log('\n3️⃣ Testing LATS access after sign in...');
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select('*')
        .limit(1);
      
      if (productsError) {
        console.log('❌ Still getting error:', productsError.message);
      } else {
        console.log('✅ LATS products now accessible!');
        console.log('   Found', products?.length || 0, 'products');
        console.log('\n🎉 SUCCESS: The 400 error should now be resolved!');
      }
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

// Run the fix
quickAuthFix();
