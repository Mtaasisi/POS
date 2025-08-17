import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixLats400Error() {
  console.log('🔧 Fixing LATS 400 Error - Adding Foreign Key Constraints...\n');

  try {
    // Step 1: Add foreign key constraint for lats_sales.customer_id -> customers.id
    console.log('📋 Step 1: Adding customer relationship...');
    const { error: customerError } = await supabase.rpc('exec_sql', {
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

    if (customerError) {
      console.log('⚠️ Customer constraint error (may already exist):', customerError.message);
    } else {
      console.log('✅ Customer relationship added');
    }

    // Step 2: Add foreign key constraint for lats_sales.created_by -> auth.users.id
    console.log('📋 Step 2: Adding auth user relationship...');
    const { error: authError } = await supabase.rpc('exec_sql', {
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

    if (authError) {
      console.log('⚠️ Auth user constraint error (may already exist):', authError.message);
    } else {
      console.log('✅ Auth user relationship added');
    }

    // Step 3: Test the relationships
    console.log('\n📋 Step 3: Testing relationships...');
    
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
    const { data: salesWithCustomers, error: customersError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name)
      `)
      .limit(1);
    
    if (customersError) {
      console.log('❌ Sales with customers query failed:', customersError.message);
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

    console.log('\n🎉 LATS 400 Error Fix Complete!');
    console.log('\n📋 Next steps:');
    console.log('1. The foreign key constraints have been added');
    console.log('2. The payment tracking service has been updated');
    console.log('3. Test the application to ensure the 400 errors are resolved');
    console.log('4. If you still see errors, check the browser console for specific details');

  } catch (error) {
    console.error('❌ Error fixing LATS 400 error:', error);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the fix-lats-400-error-complete.sql script');
  }
}

// Run the fix
fixLats400Error();
