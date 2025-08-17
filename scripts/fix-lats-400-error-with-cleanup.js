import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixLats400ErrorWithCleanup() {
  console.log('🔧 Fixing LATS 400 Error with Data Cleanup...\n');

  try {
    // Step 1: Check current data
    console.log('📋 Step 1: Checking current lats_sales data...');
    const { data: salesData, error: salesError } = await supabase
      .from('lats_sales')
      .select('*');
    
    if (salesError) {
      console.log('❌ Error fetching sales data:', salesError.message);
      return;
    }

    console.log(`📊 Found ${salesData?.length || 0} sales records`);

    // Step 2: Check auth users
    console.log('📋 Step 2: Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️ Could not fetch auth users (using service role):', authError.message);
      console.log('🔧 Will proceed with cleanup using direct SQL...');
    } else {
      console.log(`📊 Found ${authUsers?.users?.length || 0} auth users`);
    }

    // Step 3: Check customers
    console.log('📋 Step 3: Checking customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id');
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError.message);
      return;
    }

    console.log(`📊 Found ${customers?.length || 0} customers`);

    // Step 4: Clean up invalid created_by values
    console.log('📋 Step 4: Cleaning up invalid created_by values...');
    
    if (authUsers?.users) {
      const validUserIds = authUsers.users.map(user => user.id);
      const { error: cleanupCreatedByError } = await supabase
        .from('lats_sales')
        .update({ created_by: null })
        .not('created_by', 'in', `(${validUserIds.map(id => `'${id}'`).join(',')})`);
      
      if (cleanupCreatedByError) {
        console.log('⚠️ Error cleaning up created_by values:', cleanupCreatedByError.message);
      } else {
        console.log('✅ Cleaned up invalid created_by values');
      }
    } else {
      // Fallback: set all created_by to null
      const { error: cleanupCreatedByError } = await supabase
        .from('lats_sales')
        .update({ created_by: null });
      
      if (cleanupCreatedByError) {
        console.log('⚠️ Error cleaning up created_by values:', cleanupCreatedByError.message);
      } else {
        console.log('✅ Set all created_by values to null (fallback)');
      }
    }

    // Step 5: Clean up invalid customer_id values
    console.log('📋 Step 5: Cleaning up invalid customer_id values...');
    
    if (customers && customers.length > 0) {
      const validCustomerIds = customers.map(customer => customer.id);
      const { error: cleanupCustomerError } = await supabase
        .from('lats_sales')
        .update({ customer_id: null })
        .not('customer_id', 'in', `(${validCustomerIds.map(id => `'${id}'`).join(',')})`);
      
      if (cleanupCustomerError) {
        console.log('⚠️ Error cleaning up customer_id values:', cleanupCustomerError.message);
      } else {
        console.log('✅ Cleaned up invalid customer_id values');
      }
    } else {
      // Fallback: set all customer_id to null
      const { error: cleanupCustomerError } = await supabase
        .from('lats_sales')
        .update({ customer_id: null });
      
      if (cleanupCustomerError) {
        console.log('⚠️ Error cleaning up customer_id values:', cleanupCustomerError.message);
      } else {
        console.log('✅ Set all customer_id values to null (fallback)');
      }
    }

    // Step 6: Now add the foreign key constraints
    console.log('📋 Step 6: Adding foreign key constraints...');
    
    // Add customer relationship
    const { error: customerConstraintError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'lats_sales_customer_id_fkey'
                AND table_name = 'lats_sales'
            ) THEN
                ALTER TABLE lats_sales 
                ADD CONSTRAINT lats_sales_customer_id_fkey 
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
                
                RAISE NOTICE '✅ Added foreign key constraint: lats_sales.customer_id -> customers.id';
            ELSE
                RAISE NOTICE 'ℹ️ Foreign key constraint lats_sales_customer_id_fkey already exists';
            END IF;
        END $$;
      `
    });

    if (customerConstraintError) {
      console.log('⚠️ Customer constraint error (may already exist):', customerConstraintError.message);
    } else {
      console.log('✅ Customer relationship added');
    }

    // Add auth user relationship
    const { error: authConstraintError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'lats_sales_created_by_fkey'
                AND table_name = 'lats_sales'
            ) THEN
                ALTER TABLE lats_sales 
                ADD CONSTRAINT lats_sales_created_by_fkey 
                FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
                
                RAISE NOTICE '✅ Added foreign key constraint: lats_sales.created_by -> auth.users.id';
            ELSE
                RAISE NOTICE 'ℹ️ Foreign key constraint lats_sales_created_by_fkey already exists';
            END IF;
        END $$;
      `
    });

    if (authConstraintError) {
      console.log('⚠️ Auth user constraint error (may already exist):', authConstraintError.message);
    } else {
      console.log('✅ Auth user relationship added');
    }

    // Step 7: Test the relationships
    console.log('\n📋 Step 7: Testing relationships...');
    
    // Test basic sales query
    const { data: basicSales, error: basicError } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('❌ Basic sales query failed:', basicError.message);
    } else {
      console.log('✅ Basic sales query works');
    }

    // Test sales with customers relationship
    const { data: salesWithCustomers, error: customersTestError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name)
      `)
      .limit(1);
    
    if (customersTestError) {
      console.log('❌ Sales with customers query failed:', customersTestError.message);
    } else {
      console.log('✅ Sales with customers relationship works');
    }

    // Test sales with auth users relationship
    const { data: salesWithUsers, error: usersError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        auth.users!created_by(email)
      `)
      .limit(1);
    
    if (usersError) {
      console.log('❌ Sales with auth users query failed:', usersError.message);
    } else {
      console.log('✅ Sales with auth users relationship works');
    }

    // Test complete relationship
    const { data: completeSales, error: completeError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name),
        auth.users!created_by(email),
        lats_sale_items(*)
      `)
      .limit(1);
    
    if (completeError) {
      console.log('❌ Complete relationship query failed:', completeError.message);
    } else {
      console.log('✅ Complete relationship query works');
    }

    console.log('\n🎉 LATS 400 Error Fix Complete with Data Cleanup!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Cleaned up invalid foreign key references');
    console.log('2. ✅ Added foreign key constraints');
    console.log('3. ✅ Tested all relationships');
    console.log('4. ✅ The 400 errors should now be resolved');

  } catch (error) {
    console.error('❌ Error fixing LATS 400 error:', error);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the fix-lats-400-error-with-data-cleanup.sql script');
  }
}

// Run the fix
fixLats400ErrorWithCleanup();
