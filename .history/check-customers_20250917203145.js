import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('👥 Checking customers in database...');

async function checkCustomers() {
  try {
    // Get all customers
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .limit(5);

    if (error) {
      console.error('❌ Error fetching customers:', error);
      return;
    }

    if (!customers || customers.length === 0) {
      console.log('⚠️  No customers found in database');
      console.log('💡 This might be why device creation is failing - no valid customer_id');
      return;
    }

    console.log('✅ Found customers:');
    customers.forEach((customer, index) => {
      console.log(`   ${index + 1}. ${customer.name} (${customer.phone}) - ID: ${customer.id}`);
    });

    // Test device creation with a valid customer ID
    if (customers.length > 0) {
      const testCustomer = customers[0];
      console.log(`\n🧪 Testing device creation with customer: ${testCustomer.name}`);
      
      const testDevice = {
        id: crypto.randomUUID(),
        customer_id: testCustomer.id, // Use valid customer ID
        brand: 'Apple',
        model: 'iPhone 15',
        serial_number: 'TEST123456789',
        issue_description: 'Screen cracked and not responding to touch',
        status: 'assigned',
        assigned_to: null,
        expected_return_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unlock_code: null,
        repair_cost: null,
        deposit_amount: null,
        diagnosis_required: false,
        device_notes: null,
        device_cost: null,
        estimated_hours: null,
        device_condition: null,
      };

      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .insert([testDevice])
        .select();

      if (deviceError) {
        console.error('❌ Error creating device:', deviceError);
      } else {
        console.log('✅ Device created successfully with valid customer ID!');
        console.log('📱 Device ID:', deviceData[0].id);
        
        // Clean up - delete the test device
        await supabase.from('devices').delete().eq('id', deviceData[0].id);
        console.log('🧹 Test device cleaned up');
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkCustomers();
