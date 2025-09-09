import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findInvalidCustomerIds() {
  console.log('🔍 Searching for customers with invalid UUID IDs...\n');

  try {
    // Get all customers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }

    console.log(`📊 Found ${customers?.length || 0} customers total\n`);

    // Check for invalid UUIDs
    const invalidCustomers = [];
    const validCustomers = [];

    customers?.forEach(customer => {
      // Check if ID is a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(customer.id)) {
        invalidCustomers.push(customer);
        console.log(`❌ Invalid ID: ${customer.id} (${customer.name}) - ${customer.email || 'No email'}`);
      } else {
        validCustomers.push(customer);
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`✅ Valid customers: ${validCustomers.length}`);
    console.log(`❌ Invalid customers: ${invalidCustomers.length}`);

    if (invalidCustomers.length > 0) {
      console.log(`\n🔧 Customers with invalid IDs:`);
      invalidCustomers.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.email || 'No email'}) - ID: ${customer.id}`);
      });

      // Check if any of these invalid IDs are being used in customer_payments
      console.log(`\n🔍 Checking if invalid customer IDs are used in payments...`);
      
      for (const customer of invalidCustomers) {
        const { data: payments, error: paymentError } = await supabase
          .from('customer_payments')
          .select('id, amount, method, payment_date')
          .eq('customer_id', customer.id);

        if (paymentError) {
          console.log(`   ❌ Error checking payments for ${customer.name}:`, paymentError.message);
        } else if (payments && payments.length > 0) {
          console.log(`   ⚠️  Customer ${customer.name} has ${payments.length} payment(s) with invalid ID`);
        }
      }
    }

    // Look for the specific email that's causing the error
    console.log(`\n🎯 Looking for customer with email: xamuelhance10@gmail.com`);
    const { data: specificCustomer, error: specificError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .eq('email', 'xamuelhance10@gmail.com')
      .single();

    if (specificError) {
      console.log(`   ❌ Customer with email xamuelhance10@gmail.com not found`);
    } else {
      console.log(`   ✅ Found customer:`, specificCustomer);
      
      // Check if this customer's ID is being used in payments
      const { data: customerPayments, error: paymentError } = await supabase
        .from('customer_payments')
        .select('id, amount, method, payment_date')
        .eq('customer_id', specificCustomer.id);

      if (paymentError) {
        console.log(`   ❌ Error checking payments:`, paymentError.message);
      } else {
        console.log(`   📊 This customer has ${customerPayments?.length || 0} payment(s)`);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the search
findInvalidCustomerIds();
