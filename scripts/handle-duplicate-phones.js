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

async function handleDuplicatePhones() {
  console.log('🔍 Checking for duplicate phone numbers...');
  
  try {
    // Find all duplicate phone numbers
    const { data: duplicates, error } = await supabase
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
    duplicates.forEach(customer => {
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

    console.log(`⚠️  Found ${duplicateGroups.length} phone numbers with duplicates:`);
    
    for (const group of duplicateGroups) {
      console.log(`\n📞 Phone: ${group.phone}`);
      console.log(`   Customers (${group.customers.length}):`);
      
      group.customers.forEach((customer, index) => {
        console.log(`   ${index + 1}. ${customer.name} (ID: ${customer.id}) - Created: ${customer.created_at}`);
      });
    }

    console.log('\n💡 To resolve duplicates, you can:');
    console.log('   1. Manually update phone numbers in the database');
    console.log('   2. Delete duplicate customers');
    console.log('   3. Merge duplicate customer records');
    console.log('\n   After resolving duplicates, run the migration to add the unique constraint.');

  } catch (error) {
    console.error('Error handling duplicate phones:', error);
  }
}

// Function to resolve duplicates by appending a suffix
async function resolveDuplicates() {
  console.log('🔧 Resolving duplicate phone numbers...');
  
  try {
    // Find all duplicate phone numbers
    const { data: duplicates, error } = await supabase
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
    duplicates.forEach(customer => {
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

    // Resolve duplicates by appending a suffix to all but the first customer
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
          console.error(`   Error updating ${customer.name}:`, updateError);
        }
      }
    }

    console.log('✅ Duplicate phone numbers resolved!');

  } catch (error) {
    console.error('Error resolving duplicate phones:', error);
  }
}

// Main execution
const command = process.argv[2];

if (command === 'resolve') {
  resolveDuplicates();
} else {
  handleDuplicatePhones();
}
