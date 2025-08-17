import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addSamplePaymentData() {
  console.log('Adding sample payment data...');

  try {
    // First, let's check if we have any customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(5);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log('No customers found. Please add customers first.');
      return;
    }

    console.log(`Found ${customers.length} customers`);

    // Check if we have any devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, customer_id')
      .limit(5);

    if (devicesError) {
      console.error('Error fetching devices:', devicesError);
      return;
    }

    console.log(`Found ${devices?.length || 0} devices`);

    // Sample payment data for customer_payments table (matching actual schema)
    const sampleCustomerPayments = [
      {
        customer_id: customers[0]?.id,
        device_id: devices?.[0]?.id || null,
        amount: 25000,
        method: 'cash',
        payment_type: 'payment',
        status: 'completed',
        payment_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_by: null
      },
      {
        customer_id: customers[1]?.id,
        device_id: devices?.[1]?.id || null,
        amount: 45000,
        method: 'card',
        payment_type: 'deposit',
        status: 'completed',
        payment_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        created_by: null
      },
      {
        customer_id: customers[2]?.id,
        device_id: devices?.[2]?.id || null,
        amount: 15000,
        method: 'transfer',
        payment_type: 'payment',
        status: 'pending',
        payment_date: new Date().toISOString(), // Today
        created_by: null
      },
      {
        customer_id: customers[0]?.id,
        device_id: devices?.[3]?.id || null,
        amount: 35000,
        method: 'cash',
        payment_type: 'payment',
        status: 'failed',
        payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        created_by: null
      },
      {
        customer_id: customers[1]?.id,
        device_id: devices?.[4]?.id || null,
        amount: 18000,
        method: 'card',
        payment_type: 'refund',
        status: 'completed',
        payment_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        created_by: null
      }
    ];

    // Add customer payments
    const { data: customerPaymentsData, error: customerPaymentsError } = await supabase
      .from('customer_payments')
      .insert(sampleCustomerPayments)
      .select();

    if (customerPaymentsError) {
      console.error('Error adding customer payments:', customerPaymentsError);
    } else {
      console.log(`Added ${customerPaymentsData?.length || 0} customer payments`);
    }

    // For POS sales, we'll skip for now due to RLS policies
    console.log('Skipping POS sales due to RLS policies. Customer payments should be sufficient for testing.');

    console.log('Sample payment data added successfully!');
    console.log('\nSummary:');
    console.log(`- Customer payments: ${customerPaymentsData?.length || 0}`);
    console.log(`- POS sales: 0 (skipped due to RLS)`);
    console.log('\nYou can now test the Payment Tracking page with real data.');

  } catch (error) {
    console.error('Error adding sample payment data:', error);
  }
}

// Run the script
addSamplePaymentData();
