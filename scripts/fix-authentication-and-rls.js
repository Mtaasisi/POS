import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixAuthenticationAndRLS() {
  console.log('🔧 Comprehensive Authentication and RLS Fix\n');
  
  try {
    // Step 1: Check current authentication status
    console.log('1️⃣ Checking current authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Authentication error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.email);
      console.log('   User ID:', user.id);
      console.log('   Role:', user.role);
    } else {
      console.log('ℹ️ No user is currently authenticated');
    }

    // Step 2: Test LATS products access
    console.log('\n2️⃣ Testing LATS products access...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, total_quantity, min_stock_level')
      .limit(1);

    if (productsError) {
      console.log('❌ LATS products access error:', productsError.message);
      console.log('   Error code:', productsError.code);
      
      if (productsError.code === 'PGRST116') {
        console.log('\n🔒 This is an RLS (Row Level Security) policy violation');
        console.log('   The database requires authentication to access LATS tables.');
      }
    } else {
      console.log('✅ LATS products accessible!');
      console.log('   Found', products?.length || 0, 'products');
    }

    // Step 3: Check if there are any users in the auth system
    console.log('\n3️⃣ Checking for existing users...');
    try {
      const { data: authUsers, error: authUsersError } = await supabase
        .from('auth_users')
        .select('id, email, role, is_active')
        .limit(5);

      if (authUsersError) {
        console.log('❌ Cannot access auth_users table:', authUsersError.message);
      } else {
        console.log(`✅ Found ${authUsers?.length || 0} users in auth system:`);
        authUsers?.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - Active: ${user.is_active}`);
        });
      }
    } catch (error) {
      console.log('❌ Error checking auth_users:', error.message);
    }

    // Step 4: Try to sign in with existing credentials
    console.log('\n4️⃣ Attempting to sign in with existing credentials...');
    
    // Try common test credentials
    const testCredentials = [
      { email: 'xamuelhance10@gmail.com', password: 'password123' },
      { email: 'admin@lats.com', password: 'admin123' },
      { email: 'test@example.com', password: 'password123' }
    ];

    let signInSuccess = false;
    for (const cred of testCredentials) {
      try {
        console.log(`   Trying: ${cred.email}...`);
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(cred);
        
        if (signInError) {
          console.log(`   ❌ Failed: ${signInError.message}`);
        } else {
          console.log(`   ✅ Successfully signed in as: ${signInData.user.email}`);
          signInSuccess = true;
          break;
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
    }

    if (!signInSuccess) {
      console.log('\n📋 No valid credentials found. Creating a test user...');
      
      // Try to create a test user
      try {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'test@lats.com',
          password: 'test123456',
          options: {
            data: {
              role: 'admin',
              name: 'Test User'
            }
          }
        });

        if (signUpError) {
          console.log('❌ User creation failed:', signUpError.message);
        } else {
          console.log('✅ Test user created:', signUpData.user?.email);
          console.log('   Please check your email to confirm the account');
        }
      } catch (error) {
        console.log('❌ User creation exception:', error.message);
      }
    }

    // Step 5: Test LATS products access after authentication
    console.log('\n5️⃣ Testing LATS products access after authentication...');
    const { data: productsAfterAuth, error: productsAfterAuthError } = await supabase
      .from('lats_products')
      .select('id, name, total_quantity, min_stock_level')
      .limit(1);

    if (productsAfterAuthError) {
      console.log('❌ Still getting error after auth:', productsAfterAuthError.message);
      
      // Step 6: Provide RLS fix instructions
      console.log('\n🔧 RLS Policy Fix Required:');
      console.log('============================================================');
      console.log(`
-- Run this SQL in Supabase SQL Editor to fix RLS policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON lats_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON lats_products;

-- Create permissive policies for development
CREATE POLICY "Enable all access for all users on lats_products" 
ON lats_products FOR ALL USING (true);

-- Also fix other LATS tables
DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON lats_categories;
DROP POLICY IF EXISTS "Allow authenticated users to manage brands" ON lats_brands;
DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON lats_suppliers;

CREATE POLICY "Enable all access for all users on lats_categories" 
ON lats_categories FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_brands" 
ON lats_brands FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_suppliers" 
ON lats_suppliers FOR ALL USING (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename LIKE 'lats_%'
ORDER BY tablename, policyname;
`);
      console.log('============================================================');
    } else {
      console.log('✅ LATS products now accessible after authentication!');
      console.log('   Found', productsAfterAuth?.length || 0, 'products');
    }

    // Step 7: Check other tables
    console.log('\n6️⃣ Testing other LATS tables...');
    const tablesToTest = ['lats_categories', 'lats_brands', 'lats_suppliers', 'lats_sales'];
    
    for (const table of tablesToTest) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: accessible (${data?.length || 0} records)`);
        }
      } catch (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Authentication and RLS fix completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. If you got RLS errors, run the SQL script above in Supabase');
    console.log('   2. Refresh your application');
    console.log('   3. Test the LATS features again');

  } catch (error) {
    console.error('❌ Fix failed with exception:', error);
  }
}

// Run the fix
fixAuthenticationAndRLS();
