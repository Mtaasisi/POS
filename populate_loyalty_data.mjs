import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateLoyaltyData() {
  console.log('🔧 Populating loyalty tables with sample data...');
  
  try {
    // First, get existing customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .limit(10);
    
    if (customersError) {
      console.error('❌ Error fetching customers:', customersError.message);
      return;
    }
    
    console.log(`📋 Found ${customers?.length || 0} customers to work with`);
    
    if (!customers || customers.length === 0) {
      console.log('⚠️  No customers found. Please add some customers first.');
      return;
    }
    
    // Insert sample loyalty rewards
    console.log('🎁 Inserting sample loyalty rewards...');
    const { data: rewardsData, error: rewardsError } = await supabase
      .from('loyalty_rewards')
      .insert([
        {
          name: '10% Off Next Purchase',
          description: 'Get 10% off your next purchase of any item',
          points_cost: 500,
          discount_percentage: 10,
          category: 'discount',
          tier_required: 'bronze'
        },
        {
          name: 'Free Screen Protector',
          description: 'Get a free screen protector with any phone purchase',
          points_cost: 300,
          category: 'free_item',
          tier_required: 'silver'
        },
        {
          name: '₦5,000 Cashback',
          description: 'Get ₦5,000 cashback on your next purchase',
          points_cost: 1000,
          category: 'cashback',
          tier_required: 'gold'
        },
        {
          name: 'Priority Service',
          description: 'Skip the queue and get priority service',
          points_cost: 200,
          category: 'upgrade',
          tier_required: 'platinum'
        },
        {
          name: '25% Off Repair Service',
          description: 'Get 25% off any repair service',
          points_cost: 800,
          discount_percentage: 25,
          category: 'discount',
          tier_required: 'gold'
        }
      ])
      .select();
    
    if (rewardsError) {
      console.warn('⚠️  Warning inserting rewards:', rewardsError.message);
    } else {
      console.log(`✅ Inserted ${rewardsData?.length || 0} loyalty rewards`);
    }
    
    // Insert sample loyalty customers (enroll some customers in loyalty program)
    console.log('👥 Enrolling customers in loyalty program...');
    
    const loyaltyCustomers = customers.slice(0, 5).map((customer, index) => ({
      customer_id: customer.id,
      points: Math.floor(Math.random() * 5000) + 100, // Random points between 100-5100
      tier: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
      total_spent: Math.floor(Math.random() * 1000000) + 50000, // Random spent between 50k-1.05M
      join_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(), // Random join date within last year
      last_visit: new Date().toISOString(),
      rewards_redeemed: Math.floor(Math.random() * 10) // Random rewards redeemed 0-9
    }));
    
    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('loyalty_customers')
      .insert(loyaltyCustomers)
      .select();
    
    if (loyaltyError) {
      console.warn('⚠️  Warning inserting loyalty customers:', loyaltyError.message);
    } else {
      console.log(`✅ Enrolled ${loyaltyData?.length || 0} customers in loyalty program`);
    }
    
    // Verify the data
    console.log('🧪 Verifying data...');
    
    const { data: finalLoyaltyCustomers, error: finalLoyaltyError } = await supabase
      .from('loyalty_customers')
      .select('*');
    
    if (finalLoyaltyError) {
      console.error('❌ Error checking loyalty customers:', finalLoyaltyError.message);
    } else {
      console.log(`✅ Total loyalty customers: ${finalLoyaltyCustomers?.length || 0}`);
    }
    
    const { data: finalRewards, error: finalRewardsError } = await supabase
      .from('loyalty_rewards')
      .select('*');
    
    if (finalRewardsError) {
      console.error('❌ Error checking loyalty rewards:', finalRewardsError.message);
    } else {
      console.log(`✅ Total loyalty rewards: ${finalRewards?.length || 0}`);
    }
    
    console.log('🎉 Loyalty data population completed!');
    console.log('📱 Your POS system should now show loyalty status for enrolled customers.');
    
  } catch (error) {
    console.error('❌ Error populating loyalty data:', error);
  }
}

// Run the population
populateLoyaltyData(); 