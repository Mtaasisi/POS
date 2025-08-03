import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from ENVs file
dotenv.config({ path: './ENVs' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure ENVs file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enrollAllExistingCustomers() {
  try {
    console.log('🔄 Starting automatic enrollment of existing customers...');
    
    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, points, total_spent');
    
    if (customersError) throw customersError;
    
    // Get existing loyalty customers
    const { data: existingLoyalty, error: loyaltyError } = await supabase
      .from('loyalty_customers')
      .select('customer_id');
    
    if (loyaltyError) throw loyaltyError;
    
    // Create set of existing loyalty customer IDs
    const existingLoyaltyIds = new Set(existingLoyalty?.map(l => l.customer_id) || []);
    
    // Filter customers not in loyalty system
    const customersToEnroll = customers?.filter(customer => !existingLoyaltyIds.has(customer.id)) || [];
    
    console.log(`📊 Found ${customersToEnroll.length} customers to enroll out of ${customers?.length || 0} total`);
    
    if (customersToEnroll.length === 0) {
      console.log('✅ All customers are already enrolled in loyalty program');
      return;
    }
    
    // Prepare loyalty data for batch insert
    const loyaltyData = customersToEnroll.map(customer => ({
      customer_id: customer.id,
      points: customer.points || 10,
      tier: 'bronze',
      total_spent: customer.total_spent || 0,
      join_date: new Date().toISOString(),
      last_visit: new Date().toISOString(),
      rewards_redeemed: 0
    }));
    
    // Batch insert into loyalty system
    const { error: batchError } = await supabase
      .from('loyalty_customers')
      .insert(loyaltyData);
    
    if (batchError) throw batchError;
    
    // Add notes for each enrolled customer
    try {
      const notes = customersToEnroll.map(customer => ({
        id: crypto.randomUUID(),
        content: `Customer automatically enrolled in loyalty program with ${customer.points || 10} points.`,
        created_by: 'system',
        created_at: new Date().toISOString(),
        customer_id: customer.id
      }));
      
      await supabase.from('customer_notes').insert(notes);
    } catch (noteError) {
      console.warn('Could not add enrollment notes:', noteError);
    }
    
    console.log(`✅ Successfully enrolled ${customersToEnroll.length} customers in loyalty program`);
    console.log('📝 Added enrollment notes for each customer');
    
  } catch (error) {
    console.error('❌ Error enrolling existing customers:', error);
    process.exit(1);
  }
}

// Run the enrollment
enrollAllExistingCustomers().then(() => {
  console.log('🎉 Enrollment process completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Enrollment failed:', error);
  process.exit(1);
}); 