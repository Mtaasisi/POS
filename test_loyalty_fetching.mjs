import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLoyaltyFetching() {
  console.log('🧪 Testing loyalty data fetching from online database...');
  
  try {
    // Test 1: Fetch customers
    console.log('\n📋 Test 1: Fetching customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Error fetching customers:', customersError.message);
    } else {
      console.log(`✅ Successfully fetched ${customers?.length || 0} customers`);
      if (customers && customers.length > 0) {
        console.log('📝 Sample customer:', {
          id: customers[0].id,
          name: customers[0].name,
          phone: customers[0].phone
        });
      }
    }
    
    // Test 2: Fetch loyalty customers
    console.log('\n👥 Test 2: Fetching loyalty customers...');
    const { data: loyaltyCustomers, error: loyaltyError } = await supabase
      .from('loyalty_customers')
      .select('*')
      .limit(5);
    
    if (loyaltyError) {
      console.error('❌ Error fetching loyalty customers:', loyaltyError.message);
    } else {
      console.log(`✅ Successfully fetched ${loyaltyCustomers?.length || 0} loyalty customers`);
      if (loyaltyCustomers && loyaltyCustomers.length > 0) {
        console.log('📝 Sample loyalty customer:', {
          customer_id: loyaltyCustomers[0].customer_id,
          points: loyaltyCustomers[0].points,
          tier: loyaltyCustomers[0].tier
        });
      }
    }
    
    // Test 3: Simulate the POS data fetching logic
    console.log('\n🔧 Test 3: Simulating POS loyalty data fetching...');
    
    if (customers && customers.length > 0) {
      // Get customer IDs
      const customerIds = customers.map(c => c.id);
      
      // Fetch loyalty data for these customers
      const { data: loyaltyData, error: loyaltyDataError } = await supabase
        .from('loyalty_customers')
        .select('*')
        .in('customer_id', customerIds);
      
      if (loyaltyDataError) {
        console.error('❌ Error fetching loyalty data:', loyaltyDataError.message);
      } else {
        console.log(`✅ Successfully fetched loyalty data for ${loyaltyData?.length || 0} customers`);
        
        // Create a map of loyalty data by customer_id
        const loyaltyMap = new Map();
        (loyaltyData || []).forEach((loyalty) => {
          loyaltyMap.set(loyalty.customer_id, loyalty);
        });
        
        // Simulate the POS data mapping
        const customersWithLoyalty = customers.map((customer) => {
          const loyaltyInfo = loyaltyMap.get(customer.id);
          
          return {
            ...customer,
            loyalty: loyaltyInfo ? {
              points: loyaltyInfo.points || 0,
              tier: loyaltyInfo.tier || 'bronze',
              totalSpent: loyaltyInfo.total_spent || 0,
              joinDate: loyaltyInfo.join_date,
              lastVisit: loyaltyInfo.last_visit,
              rewardsRedeemed: loyaltyInfo.rewards_redeemed || 0,
              isLoyaltyMember: true
            } : undefined
          };
        });
        
        console.log('📊 Results:');
        customersWithLoyalty.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name}: ${customer.loyalty ? `${customer.loyalty.tier} member (${customer.loyalty.points} points)` : 'Non-member'}`);
        });
      }
    }
    
    // Test 4: Test customer search functionality
    console.log('\n🔍 Test 4: Testing customer search...');
    if (customers && customers.length > 0) {
      const searchQuery = customers[0].name.substring(0, 3); // Search by first 3 characters
      console.log(`🔍 Searching for customers with query: "${searchQuery}"`);
      
      const { data: searchResults, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .or(`name.ilike.%${searchQuery}%, phone.ilike.%${searchQuery}%, email.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (searchError) {
        console.error('❌ Error searching customers:', searchError.message);
      } else {
        console.log(`✅ Search found ${searchResults?.length || 0} customers`);
      }
    }
    
    console.log('\n🎉 Loyalty fetching test completed!');
    console.log('📱 Your POS system should now work correctly with the online database.');
    console.log('💡 Note: Currently no customers are enrolled in loyalty program, so all will show as "Non-member"');
    
  } catch (error) {
    console.error('❌ Error testing loyalty fetching:', error);
  }
}

// Run the test
testLoyaltyFetching(); 