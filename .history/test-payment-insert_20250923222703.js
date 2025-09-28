import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPaymentInsert() {
  console.log('🧪 Testing Customer Payment Insert...');
  
  try {
    // Test 1: Minimal insert with only required fields
    console.log('\n📋 Test 1: Minimal insert with required fields only...');
    
    const minimalData = {
      customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed'
    };
    
    const { data: minimalResult, error: minimalError } = await supabase
      .from('customer_payments')
      .insert([minimalData])
      .select();
    
    if (minimalError) {
      console.log('❌ Minimal insert failed:', minimalError.message);
      console.log('🔍 Error details:', minimalError);
    } else {
      console.log('✅ Minimal insert successful');
      console.log('📊 Inserted record:', minimalResult);
      
      // Clean up
      if (minimalResult && minimalResult.length > 0) {
        await supabase
          .from('customer_payments')
          .delete()
          .eq('id', minimalResult[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    // Test 2: Full insert with all fields (like the application does)
    console.log('\n📋 Test 2: Full insert with all fields...');
    
    const fullData = {
      customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      device_id: null,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      currency: 'TZS',
      payment_account_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      payment_method_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      reference: 'TEST_PAYMENT_REFERENCE',
      notes: 'Test payment notes',
      payment_date: new Date().toISOString(),
      created_by: '00000000-0000-0000-0000-000000000000' // dummy UUID
      // Note: NOT including updated_at - let the trigger handle it
    };
    
    const { data: fullResult, error: fullError } = await supabase
      .from('customer_payments')
      .insert([fullData])
      .select();
    
    if (fullError) {
      console.log('❌ Full insert failed:', fullError.message);
      console.log('🔍 Error details:', fullError);
      
      // Check for specific constraint violations
      if (fullError.message.includes('violates foreign key constraint')) {
        console.log('💡 Foreign key constraint violation detected');
        console.log('💡 Check if referenced IDs exist in related tables');
      }
      
      if (fullError.message.includes('violates check constraint')) {
        console.log('💡 Check constraint violation detected');
        console.log('💡 Check if field values match allowed constraints');
      }
      
      if (fullError.message.includes('invalid input syntax')) {
        console.log('💡 Invalid input syntax detected');
        console.log('💡 Check data types and format of input values');
      }
    } else {
      console.log('✅ Full insert successful');
      console.log('📊 Inserted record:', fullResult);
      
      // Clean up
      if (fullResult && fullResult.length > 0) {
        await supabase
          .from('customer_payments')
          .delete()
          .eq('id', fullResult[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    // Test 3: Insert with updated_at (like the application currently does)
    console.log('\n📋 Test 3: Insert with updated_at field (current app behavior)...');
    
    const withUpdatedAtData = {
      customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      device_id: null,
      amount: 100.00,
      method: 'cash',
      payment_type: 'payment',
      status: 'completed',
      currency: 'TZS',
      payment_account_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      payment_method_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      reference: 'TEST_PAYMENT_WITH_UPDATED_AT',
      notes: 'Test payment with updated_at',
      payment_date: new Date().toISOString(),
      created_by: '00000000-0000-0000-0000-000000000000', // dummy UUID
      updated_at: new Date().toISOString() // This might be the problem!
    };
    
    const { data: updatedAtResult, error: updatedAtError } = await supabase
      .from('customer_payments')
      .insert([withUpdatedAtData])
      .select();
    
    if (updatedAtError) {
      console.log('❌ Insert with updated_at failed:', updatedAtError.message);
      console.log('🔍 Error details:', updatedAtError);
      console.log('💡 This might be the cause of your 400 error!');
    } else {
      console.log('✅ Insert with updated_at successful');
      console.log('📊 Inserted record:', updatedAtResult);
      
      // Clean up
      if (updatedAtResult && updatedAtResult.length > 0) {
        await supabase
          .from('customer_payments')
          .delete()
          .eq('id', updatedAtResult[0].id);
        console.log('🧹 Test data cleaned up');
      }
    }
    
    // Test 4: Check table constraints
    console.log('\n📋 Test 4: Checking table constraints...');
    
    try {
      const { data: constraints, error: constraintsError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              tc.constraint_name,
              tc.constraint_type,
              kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name,
              cc.check_clause
            FROM information_schema.table_constraints AS tc 
            LEFT JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            LEFT JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            LEFT JOIN information_schema.check_constraints AS cc
              ON tc.constraint_name = cc.constraint_name
            WHERE tc.table_name = 'customer_payments'
            AND tc.table_schema = 'public'
            ORDER BY tc.constraint_type, tc.constraint_name;
          `
        });
      
      if (constraintsError) {
        console.log('⚠️  Could not retrieve constraints:', constraintsError.message);
      } else {
        console.log('📊 Table constraints:');
        console.table(constraints);
      }
    } catch (err) {
      console.log('⚠️  Constraint check failed:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the tests
testPaymentInsert();
