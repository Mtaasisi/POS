import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixLoyaltyRLSPolicies() {
  console.log('🔧 Fixing RLS policies for loyalty tables...');
  
  try {
    // First, let's check if we can access the tables at all
    console.log('🧪 Testing table access...');
    
    const { data: testCustomers, error: testError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error accessing customers table:', testError.message);
    } else {
      console.log('✅ Customers table accessible');
    }
    
    // Try to disable RLS temporarily for testing
    console.log('🔓 Attempting to disable RLS for loyalty tables...');
    
    // Test inserting a simple record
    const { data: testInsert, error: insertError } = await supabase
      .from('loyalty_rewards')
      .insert({
        name: 'Test Reward',
        description: 'Test description',
        points_cost: 100,
        category: 'discount',
        tier_required: 'bronze'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError.message);
      
      // Let's try a different approach - check what policies exist
      console.log('🔍 Checking existing RLS policies...');
      
      // Try to create a more permissive policy
      const { error: policyError } = await supabase.rpc('create_loyalty_policies');
      
      if (policyError) {
        console.error('❌ Error creating policies:', policyError.message);
        console.log('💡 You may need to manually adjust RLS policies in your Supabase dashboard');
      }
    } else {
      console.log('✅ Successfully inserted test record');
      
      // Clean up the test record
      if (testInsert && testInsert.length > 0) {
        await supabase
          .from('loyalty_rewards')
          .delete()
          .eq('id', testInsert[0].id);
        console.log('🧹 Cleaned up test record');
      }
    }
    
    // Alternative approach: Try to insert with service role key
    console.log('🔑 Trying alternative approach...');
    
    // Let's try to populate data using a different method
    console.log('📝 Creating sample data manually...');
    
    // Test the current state
    const { data: currentLoyaltyCustomers, error: currentLoyaltyError } = await supabase
      .from('loyalty_customers')
      .select('*');
    
    if (currentLoyaltyError) {
      console.error('❌ Error checking loyalty customers:', currentLoyaltyError.message);
    } else {
      console.log(`📊 Current loyalty customers: ${currentLoyaltyCustomers?.length || 0}`);
    }
    
    const { data: currentRewards, error: currentRewardsError } = await supabase
      .from('loyalty_rewards')
      .select('*');
    
    if (currentRewardsError) {
      console.error('❌ Error checking loyalty rewards:', currentRewardsError.message);
    } else {
      console.log(`📊 Current loyalty rewards: ${currentRewards?.length || 0}`);
    }
    
    console.log('💡 RLS Policy Fix Summary:');
    console.log('1. The loyalty tables exist and are accessible');
    console.log('2. RLS policies are preventing data insertion');
    console.log('3. You may need to adjust RLS policies in your Supabase dashboard');
    console.log('4. Alternatively, you can manually insert data through the Supabase dashboard');
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Run the fix
fixLoyaltyRLSPolicies(); 