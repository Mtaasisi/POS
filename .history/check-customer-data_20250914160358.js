import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCustomerData() {
  console.log('🔍 Checking customer data structure...\n');

  try {
    // Get a sample customer record
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Error fetching customers:', error.message);
      return;
    }
    
    if (customers && customers.length > 0) {
      console.log(`📊 Found ${customers.length} customer records\n`);
      
      customers.forEach((customer, index) => {
        console.log(`👤 Customer ${index + 1}: ${customer.name}`);
        console.log('📋 Available fields:');
        
        // Check key fields that are showing as "Unknown" or "Never"
        const keyFields = [
          'id',
          'name',
          'phone',
          'email',
          'is_active',
          'created_at',
          'updated_at',
          'last_visit',
          'joined_date',
          'birth_month',
          'birth_day',
          'total_spent',
          'points',
          'loyalty_level'
        ];
        
        keyFields.forEach(field => {
          const value = customer[field];
          if (value !== null && value !== undefined) {
            console.log(`  ✅ ${field}: ${value}`);
          } else {
            console.log(`  ❌ ${field}: ${value} (missing)`);
          }
        });
        
        console.log('\n🔍 Full record structure:');
        console.log(JSON.stringify(customer, null, 2));
        console.log('\n' + '='.repeat(50) + '\n');
      });
      
      // Check what fields are actually in the database
      console.log('📋 All available fields in customers table:');
      if (customers[0]) {
        Object.keys(customers[0]).forEach(field => {
          console.log(`  - ${field}`);
        });
      }
      
    } else {
      console.log('❌ No customers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCustomerData();
