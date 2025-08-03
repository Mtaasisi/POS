import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from ENVs file
dotenv.config({ path: './ENVs' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enrollCustomer(customerId) {
  try {
    // Check if customer already exists in loyalty system
    const { data: existingLoyalty, error: checkError } = await supabase
      .from('loyalty_customers')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingLoyalty) {
      return { success: true, message: 'Already enrolled' };
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Add customer to loyalty system
    const { error: loyaltyError } = await supabase
      .from('loyalty_customers')
      .insert([{
        customer_id: customerId,
        points: customer.points || 10,
        tier: 'bronze',
        total_spent: customer.total_spent || 0,
        join_date: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        rewards_redeemed: 0
      }]);

    if (loyaltyError) throw loyaltyError;

    return { success: true, message: 'Enrolled successfully' };
  } catch (error) {
    console.error(`Error enrolling customer ${customerId}:`, error);
    return { success: false, message: error.message };
  }
}

async function enrollAllExistingCustomers() {
  try {
    console.log('🔄 Starting automatic enrollment of existing customers...');
    
    // Get all customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, points, total_spent');
    
    if (customersError) throw customersError;
    
    console.log(`📊 Found ${customers.length} total customers`);
    
    let enrolledCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Enroll customers one by one
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      console.log(`Processing customer ${i + 1}/${customers.length}: ${customer.name}`);
      
      const result = await enrollCustomer(customer.id);
      
      if (result.success) {
        if (result.message === 'Already enrolled') {
          skippedCount++;
        } else {
          enrolledCount++;
        }
      } else {
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Enrollment completed:`);
    console.log(`   - Enrolled: ${enrolledCount} customers`);
    console.log(`   - Skipped (already enrolled): ${skippedCount} customers`);
    console.log(`   - Errors: ${errorCount} customers`);
    
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