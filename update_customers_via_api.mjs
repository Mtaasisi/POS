import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');
console.log(`📈 Total customers in backup: ${backupData.data.customers.length}`);

// Function to normalize customer data for API
function normalizeCustomerForAPI(customer) {
  return {
    id: customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    gender: customer.gender || 'male',
    city: customer.city || 'Dar es Salaam',
    joinedDate: customer.joined_date || new Date().toISOString(),
    loyaltyLevel: customer.loyalty_level || 'bronze',
    colorTag: customer.color_tag || 'normal',
    referredBy: customer.referred_by || null,
    totalSpent: customer.total_spent || 0,
    points: customer.points || 10,
    lastVisit: customer.last_visit || new Date().toISOString(),
    isActive: customer.is_active !== undefined ? customer.is_active : true,
    whatsapp: customer.whatsapp || '',
    referralSource: customer.referral_source || '',
    birthMonth: customer.birth_month || '',
    birthDay: customer.birth_day || '',
    totalReturns: customer.total_returns || 0,
    profileImage: customer.profile_image || null,
    initialNotes: customer.initial_notes || null,
    locationDescription: customer.location_description || null,
    nationalId: customer.national_id || null
  };
}

// Function to update a single customer
async function updateCustomer(customer) {
  try {
    // First check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`❌ Error checking customer ${customer.name}:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    if (existingCustomer) {
      // Update existing customer
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          gender: customer.gender,
          city: customer.city,
          joined_date: customer.joinedDate,
          loyalty_level: customer.loyaltyLevel,
          color_tag: customer.colorTag,
          referred_by: customer.referredBy,
          total_spent: customer.totalSpent,
          points: customer.points,
          last_visit: customer.lastVisit,
          is_active: customer.isActive,
          whatsapp: customer.whatsapp,
          referral_source: customer.referralSource,
          birth_month: customer.birthMonth,
          birth_day: customer.birthDay,
          total_returns: customer.totalReturns,
          profile_image: customer.profileImage,
          initial_notes: customer.initialNotes,
          location_description: customer.locationDescription,
          national_id: customer.nationalId,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`❌ Error updating customer ${customer.name}:`, updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, action: 'updated' };
    } else {
      // Insert new customer
      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          gender: customer.gender,
          city: customer.city,
          joined_date: customer.joinedDate,
          loyalty_level: customer.loyaltyLevel,
          color_tag: customer.colorTag,
          referred_by: customer.referredBy,
          total_spent: customer.totalSpent,
          points: customer.points,
          last_visit: customer.lastVisit,
          is_active: customer.isActive,
          whatsapp: customer.whatsapp,
          referral_source: customer.referralSource,
          birth_month: customer.birthMonth,
          birth_day: customer.birthDay,
          total_returns: customer.totalReturns,
          profile_image: customer.profileImage,
          initial_notes: customer.initialNotes,
          location_description: customer.locationDescription,
          national_id: customer.nationalId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error(`❌ Error inserting customer ${customer.name}:`, insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, action: 'inserted' };
    }
  } catch (error) {
    console.error(`❌ Exception updating customer ${customer.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Function to update customers in batches
async function updateCustomersInBatches(customers, batchSize = 5) {
  const totalCustomers = customers.length;
  let updatedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalCustomers} customers in batches of ${batchSize}`);

  for (let i = 0; i < totalCustomers; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(totalCustomers / batchSize);

    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} customers)`);

    // Process each customer in the batch
    for (const customer of batch) {
      const result = await updateCustomer(customer);
      
      if (result.success) {
        if (result.action === 'updated') {
          updatedCount++;
        } else {
          insertedCount++;
        }
      } else {
        errorCount++;
        errors.push({ customer: customer.name, error: result.error });
      }

      // Small delay between individual customers
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Delay between batches
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { updatedCount, insertedCount, errorCount, errors };
}

// Main function
async function updateAllCustomers() {
  try {
    console.log('🚀 Starting customer update process...');

    // Normalize all customer data
    const normalizedCustomers = backupData.data.customers.map(normalizeCustomerForAPI);
    console.log(`✅ Normalized ${normalizedCustomers.length} customers`);

    // Update customers in batches
    const result = await updateCustomersInBatches(normalizedCustomers, 10);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} customers`);
    console.log(`✅ Successfully inserted: ${result.insertedCount} customers`);
    console.log(`❌ Errors: ${result.errorCount} customers`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details:');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  ${error.customer}: ${error.error}`);
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