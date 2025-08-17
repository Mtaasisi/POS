import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPhoneUniqueness() {
  console.log('🔍 Verifying phone number uniqueness...');
  
  try {
    // Check for the specific phone number that was causing the error
    const { data: specificPhone, error: specificError } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .eq('phone', '+255594561090');

    if (specificError) {
      console.error('Error checking specific phone:', specificError);
      return;
    }

    console.log(`📞 Phone +255594561090: ${specificPhone?.length || 0} customers`);
    if (specificPhone) {
      specificPhone.forEach(customer => {
        console.log(`   - ${customer.name} (${customer.id}): ${customer.phone}`);
      });
    }

    // Check for any duplicates
    const { data: allCustomers, error } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('phone, created_at');

    if (error) {
      console.error('Error fetching customers:', error);
      return;
    }

    // Group by phone number to find duplicates
    const phoneGroups = {};
    allCustomers.forEach(customer => {
      if (!phoneGroups[customer.phone]) {
        phoneGroups[customer.phone] = [];
      }
      phoneGroups[customer.phone].push(customer);
    });

    // Filter only groups with duplicates
    const duplicateGroups = Object.entries(phoneGroups)
      .filter(([phone, customers]) => customers.length > 1)
      .map(([phone, customers]) => ({ phone, customers }));

    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate phone numbers found!');
      console.log('✅ Ready to apply unique constraint.');
    } else {
      console.log(`⚠️  Found ${duplicateGroups.length} phone numbers with duplicates:`);
      
      duplicateGroups.forEach(group => {
        console.log(`\n📞 Phone: ${group.phone}`);
        group.customers.forEach((customer, index) => {
          console.log(`   ${index + 1}. ${customer.name} (${customer.id}): ${customer.phone}`);
        });
      });
    }

  } catch (error) {
    console.error('Error verifying phone uniqueness:', error);
  }
}

verifyPhoneUniqueness();
