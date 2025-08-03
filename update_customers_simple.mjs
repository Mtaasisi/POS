import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');
console.log(`📈 Total customers in backup: ${backupData.data.customers.length}`);

// Function to normalize customer data
function normalizeCustomerData(customer) {
  return {
    id: customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    gender: customer.gender || 'male',
    city: customer.city || 'Dar es Salaam',
    joined_date: customer.joined_date || new Date().toISOString(),
    loyalty_level: customer.loyalty_level || 'bronze',
    color_tag: customer.color_tag || 'normal',
    referred_by: customer.referred_by || null,
    total_spent: customer.total_spent || 0,
    points: customer.points || 10,
    last_visit: customer.last_visit || new Date().toISOString(),
    is_active: customer.is_active !== undefined ? customer.is_active : true,
    whatsapp: customer.whatsapp || '',
    referral_source: customer.referral_source || '',
    birth_month: customer.birth_month || '',
    birth_day: customer.birth_day || '',
    customer_tag: customer.customer_tag || 'normal',
    notes: customer.notes || '',
    total_returns: customer.total_returns || 0,
    profile_image: customer.profile_image || null,
    initial_notes: customer.initial_notes || null,
    location_description: customer.location_description || null,
    national_id: customer.national_id || null,
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: customer.updated_at || new Date().toISOString()
  };
}

// Function to update customers one by one
async function updateCustomersOneByOne(customers) {
  const totalCustomers = customers.length;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalCustomers} customers one by one`);

  for (let i = 0; i < totalCustomers; i++) {
    const customer = customers[i];
    const customerNumber = i + 1;

    if (customerNumber % 10 === 0) {
      console.log(`📦 Processing customer ${customerNumber}/${totalCustomers}`);
    }

    try {
      // First try to check if customer exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customer.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new customers
        console.error(`❌ Error checking customer ${customerNumber}:`, checkError);
        errorCount++;
        errors.push({ customer: customerNumber, error: checkError.message });
        continue;
      }

      let result;
      if (existingCustomer) {
        // Update existing customer
        result = await supabase
          .from('customers')
          .update(customer)
          .eq('id', customer.id);
      } else {
        // Insert new customer
        result = await supabase
          .from('customers')
          .insert(customer);
      }

      if (result.error) {
        console.error(`❌ Error updating customer ${customerNumber}:`, result.error);
        errorCount++;
        errors.push({ customer: customerNumber, error: result.error.message });
      } else {
        updatedCount++;
      }

      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 50));

    } catch (error) {
      console.error(`❌ Exception updating customer ${customerNumber}:`, error);
      errorCount++;
      errors.push({ customer: customerNumber, error: error.message });
    }
  }

  return { updatedCount, errorCount, errors };
}

// Main function
async function updateAllCustomers() {
  try {
    console.log('🚀 Starting customer update process...');

    // Normalize all customer data
    const normalizedCustomers = backupData.data.customers.map(normalizeCustomerData);
    console.log(`✅ Normalized ${normalizedCustomers.length} customers`);

    // Update customers one by one
    const result = await updateCustomersOneByOne(normalizedCustomers);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} customers`);
    console.log(`❌ Errors: ${result.errorCount} customers`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details (first 10):');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  Customer ${error.customer}: ${error.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { count, error: countError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting customers:', countError);
    } else {
      console.log(`📈 Total customers in database after update: ${count}`);
    }

    console.log('\n🎉 Customer update process completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateAllCustomers(); 