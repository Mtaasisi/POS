import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
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
    created_by: customer.created_by || null,
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: customer.updated_at || new Date().toISOString()
  };
}

// Function to update customers in batches
async function updateCustomersInBatches(customers, batchSize = 10) {
  const totalCustomers = customers.length;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalCustomers} customers in batches of ${batchSize}`);

  for (let i = 0; i < totalCustomers; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalCustomers / batchSize);

    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} customers)`);

    try {
      // Use upsert to insert or update customers
      const { data, error } = await supabase
        .from('customers')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ Error in batch ${batchNumber}:`, error);
        errorCount += batch.length;
        errors.push({ batch: batchNumber, error: error.message });
      } else {
        updatedCount += batch.length;
        console.log(`✅ Batch ${batchNumber} processed successfully`);
      }

      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception in batch ${batchNumber}:`, error);
      errorCount += batch.length;
      errors.push({ batch: batchNumber, error: error.message });
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

    // Update customers in batches
    const result = await updateCustomersInBatches(normalizedCustomers, 20);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} customers`);
    console.log(`❌ Errors: ${result.errorCount} customers`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details:');
      result.errors.forEach(error => {
        console.log(`  Batch ${error.batch}: ${error.error}`);
      });
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