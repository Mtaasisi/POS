import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the main app
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseCustomerPaymentsAuthIssue() {
  console.log('🔍 Diagnosing Customer Payments Authentication Issue...');
  
  try {
    // Step 1: Check current authentication status
    console.log('\n📋 Step 1: Checking authentication status...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    }
    
    if (!user) {
      console.log('⚠️  No user authenticated');
      console.log('💡 This is likely the cause of your 400 error!');
      console.log('');
      console.log('🔧 Solutions:');
      console.log('1. Make sure the user is logged in before making payments');
      console.log('2. Check if the session has expired');
      console.log('3. Implement session refresh before payment operations');
      console.log('');
      console.log('📝 Code to add before payment operations:');
      console.log(`
// Before making payment requests, ensure user is authenticated
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (!user) {
  // Redirect to login or refresh session
  console.error('User not authenticated');
  return;
}

// Optional: Refresh session to ensure it's valid
const { error: refreshError } = await supabase.auth.refreshSession();
if (refreshError) {
  console.error('Session refresh failed:', refreshError);
  // Handle refresh failure
}
      `);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    console.log('👤 User ID:', user.id);
    
    // Step 2: Check session status
    console.log('\n📋 Step 2: Checking session status...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    }
    
    if (!session) {
      console.log('⚠️  No active session');
      console.log('💡 Try refreshing the session');
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.log('❌ Session refresh failed:', refreshError.message);
      } else if (refreshData.session) {
        console.log('✅ Session refreshed successfully');
      } else {
        console.log('❌ No session after refresh');
      }
    } else {
      console.log('✅ Active session found');
      console.log('🕐 Session expires at:', new Date(session.expires_at * 1000).toLocaleString());
    }
    
    // Step 3: Test payment insert with authenticated user
    console.log('\n📋 Step 3: Testing payment insert with authenticated user...');
    
    try {
      const paymentData = {
        customer_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        device_id: null,
        amount: 100.00,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed',
        currency: 'TZS',
        payment_account_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        payment_method_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        reference: 'AUTH_TEST_PAYMENT',
        notes: 'Test payment with authenticated user',
        payment_date: new Date().toISOString(),
        created_by: user.id // Use the authenticated user's ID
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('customer_payments')
        .insert([paymentData])
        .select();
      
      if (insertError) {
        console.log('❌ Authenticated insert failed:', insertError.message);
        console.log('🔍 Error details:', insertError);
        
        if (insertError.message.includes('violates foreign key constraint')) {
          console.log('💡 Foreign key constraint violation');
          console.log('💡 The dummy UUIDs don\'t exist in related tables');
          console.log('💡 In your app, use real customer_id and payment_account_id');
        }
      } else {
        console.log('✅ Authenticated insert successful!');
        console.log('📊 Inserted record:', insertData);
        
        // Clean up test data
        if (insertData && insertData.length > 0) {
          await supabase
            .from('customer_payments')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Test data cleaned up');
        }
        
        console.log('');
        console.log('🎉 SUCCESS! The authentication issue is resolved!');
        console.log('✅ Your payment functionality should work now');
        console.log('✅ Make sure users are logged in before making payments');
      }
    } catch (err) {
      console.log('❌ Insert test failed:', err.message);
    }
    
    // Step 4: Provide recommendations
    console.log('\n📋 Step 4: Recommendations for your application...');
    console.log('');
    console.log('🔧 Add this to your payment service:');
    console.log(`
async createRepairPayment(data: CreateRepairPaymentData, userId: string): Promise<RepairPayment> {
  try {
    // 1. Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('User not authenticated. Please log in and try again.');
    }
    
    // 2. Optional: Refresh session to ensure it's valid
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.warn('Session refresh failed:', refreshError);
    }
    
    // 3. Proceed with payment creation...
    const paymentData = {
      customer_id: data.customerId,
      device_id: data.deviceId || null,
      amount: data.amount,
      method: data.paymentMethod,
      payment_type: 'payment',
      status: 'completed',
      currency: data.currency || 'TZS',
      payment_account_id: data.paymentAccountId,
      payment_method_id: data.paymentAccountId,
      reference: data.reference || null,
      notes: data.notes || null,
      payment_date: new Date().toISOString(),
      created_by: user.id // Use authenticated user's ID
      // Don't include updated_at - let the trigger handle it
    };
    
    // Rest of your payment logic...
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
}
    `);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseCustomerPaymentsAuthIssue();
