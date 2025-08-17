import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPaymentData() {
  console.log('Checking existing payment data...');

  try {
    // Check customer payments
    const { data: customerPayments, error: customerPaymentsError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(10);

    if (customerPaymentsError) {
      console.error('Error fetching customer payments:', customerPaymentsError);
    } else {
      console.log(`Found ${customerPayments?.length || 0} customer payments`);
      if (customerPayments && customerPayments.length > 0) {
        console.log('Sample customer payment:', customerPayments[0]);
      }
    }

    // Check POS sales
    try {
      const { data: posSales, error: posSalesError } = await supabase
        .from('lats_sales')
        .select('*')
        .limit(10);

      if (posSalesError) {
        console.error('Error fetching POS sales:', posSalesError);
      } else {
        console.log(`Found ${posSales?.length || 0} POS sales`);
        if (posSales && posSales.length > 0) {
          console.log('Sample POS sale:', posSales[0]);
        }
      }
    } catch (posError) {
      console.log('POS sales not accessible due to RLS policies');
    }

    // Check customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    } else {
      console.log(`Found ${customers?.length || 0} customers`);
    }

    // Check devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, customer_id')
      .limit(5);

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
    } else {
      console.log(`Found ${devices?.length || 0} devices`);
    }

  } catch (error) {
    console.error('Error checking payment data:', error);
  }
}

// Run the script
checkPaymentData();
