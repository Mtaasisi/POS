import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkMissingFields() {
  console.log('🔍 Checking missing customer fields in UI vs Database...\n');

  try {
    // Fetch a customer record to see all available fields
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching customers:', error.message);
      return;
    }
    
    if (customers && customers.length > 0) {
      const customer = customers[0];
      const dbFields = Object.keys(customer);
      
      console.log('📊 Database Fields (All Available):');
      dbFields.forEach(field => {
        console.log(`  ✅ ${field}: ${customer[field] !== null ? customer[field] : 'null'}`);
      });

      console.log('\n📱 Currently Displayed in UI:');
      const displayedFields = [
        'name', 'phone', 'email', 'whatsapp', 'city', 'country', 'address',
        'birth_month', 'birth_day', 'gender', 'notes', 'initial_notes',
        'is_active', 'created_at', 'joined_date', 'last_visit', 'updated_at',
        'loyalty_level', 'color_tag', 'customer_tag', 'referral_source', 'referred_by',
        'total_spent', 'points', 'total_purchases', 'last_purchase_date', 'whatsapp_opt_out'
      ];
      
      displayedFields.forEach(field => {
        if (dbFields.includes(field)) {
          console.log(`  ✅ ${field}`);
        }
      });

      console.log('\n❌ Missing from UI (Available in Database):');
      const missingFields = [];
      
      dbFields.forEach(field => {
        if (!displayedFields.includes(field) && field !== 'id') {
          missingFields.push(field);
          console.log(`  ❌ ${field}: ${customer[field] !== null ? customer[field] : 'null'}`);
        }
      });

      console.log('\n🎯 Summary:');
      console.log(`- Total database fields: ${dbFields.length}`);
      console.log(`- Currently displayed in UI: ${displayedFields.filter(f => dbFields.includes(f)).length}`);
      console.log(`- Missing from UI: ${missingFields.length}`);
      
      if (missingFields.length > 0) {
        console.log('\n💡 Missing Fields to Add:');
        missingFields.forEach(field => {
          console.log(`- ${field}`);
        });
      } else {
        console.log('\n✅ All database fields are displayed in the UI!');
      }

    } else {
      console.log('❌ No customers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMissingFields();
