import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Use service role key to bypass RLS policies
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDuplicatePhonesDirect() {
  console.log('🔧 Fixing duplicate phone numbers directly...');
  
  try {
    // Get all customers with phone numbers
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
      return;
    }

    console.log(`🔧 Found ${duplicateGroups.length} phone numbers with duplicates. Fixing...`);

    // Fix each duplicate group
    for (const group of duplicateGroups) {
      const { phone, customers } = group;
      
      // Keep the first customer unchanged, update the rest
      for (let i = 1; i < customers.length; i++) {
        const customer = customers[i];
        const newPhone = `${phone}_dup${i}`;
        
        console.log(`   Updating ${customer.name} (${customer.id}): ${phone} → ${newPhone}`);
        
        const { error: updateError } = await supabase
          .from('customers')
          .update({ phone: newPhone })
          .eq('id', customer.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${customer.name}:`, updateError);
        } else {
          console.log(`   ✅ Updated ${customer.name}`);
        }
      }
    }

    console.log('✅ Duplicate phone numbers fixed!');

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const { data: verifyCustomers, error: verifyError } = await supabase
      .from('customers')
      .select('id, name, phone, created_at')
      .not('phone', 'is', null)
      .neq('phone', '')
      .order('phone, created_at');

    if (verifyError) {
      console.error('Error verifying fix:', verifyError);
      return;
    }

    // Check for remaining duplicates
    const verifyGroups = {};
    verifyCustomers.forEach(customer => {
      if (!verifyGroups[customer.phone]) {
        verifyGroups[customer.phone] = [];
      }
      verifyGroups[customer.phone].push(customer);
    });

    const remainingDuplicates = Object.entries(verifyGroups)
      .filter(([phone, customers]) => customers.length > 1)
      .map(([phone, customers]) => ({ phone, customers }));

    if (remainingDuplicates.length === 0) {
      console.log('✅ Verification successful! No duplicate phone numbers remain.');
      console.log('✅ Ready to apply unique constraint.');
    } else {
      console.log(`⚠️  Still found ${remainingDuplicates.length} phone numbers with duplicates:`);
      remainingDuplicates.forEach(group => {
        console.log(`   📞 ${group.phone}: ${group.customers.length} customers`);
      });
    }

  } catch (error) {
    console.error('Error fixing duplicate phones:', error);
  }
}

fixDuplicatePhonesDirect();
