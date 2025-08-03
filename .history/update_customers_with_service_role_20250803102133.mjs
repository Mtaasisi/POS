import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration with service role key to bypass RLS
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.YourServiceRoleKeyHere';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the specific backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');
console.log(`📈 Total customers in backup: ${backupData.data.customers.length}`);

// Function to normalize customer data with only existing columns
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

// Function to normalize device data with only existing columns
function normalizeDeviceData(device) {
  return {
    id: device.id,
    customer_id: device.customer_id,
    brand: device.brand || '',
    model: device.model || '',
    serial_number: device.serial_number || '',
    issue_description: device.issue_description || '',
    status: device.status || 'pending',
    assigned_to: device.assigned_to || null,
    expected_return_date: device.expected_return_date || null,
    created_at: device.created_at || new Date().toISOString(),
    updated_at: device.updated_at || new Date().toISOString(),
    // Only include columns that exist in the current schema
    device_type: device.device_type || 'phone',
    repair_cost: device.repair_cost || null,
    deposit_amount: device.deposit_amount || null,
    device_cost: device.device_cost || null,
    diagnosis_required: device.diagnosis_required || false,
    device_notes: device.device_notes || null,
    device_condition: device.device_condition || null,
    imei: device.imei || null,
    is_internal: device.is_internal || false,
    department: device.department || null,
    location: device.location || null,
    created_by: device.created_by || null,
    condition: device.condition || null,
    power_status: device.power_status || null,
    notes: device.notes || null,
    purchase_type: device.purchase_type || 'repair',
    purchase_price: device.purchase_price || null,
    estimated_hours: device.estimated_hours || null,
    warranty_start: device.warranty_start || null,
    warranty_end: device.warranty_end || null,
    warranty_status: device.warranty_status || null,
    repair_count: device.repair_count || 0,
    priority_level: device.priority_level || null,
    issue_type: device.issue_type || null,
    labor_cost: device.labor_cost || null,
    parts_cost: device.parts_cost || null,
    payment_status: device.payment_status || null,
    symptoms: device.symptoms || null,
    possible_causes: device.possible_causes || null,
    additional_notes: device.additional_notes || null
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

// Function to import devices
async function importDevices(devices) {
  console.log(`🔧 Importing ${devices.length} devices...`);
  
  const normalizedDevices = devices.map(normalizeDeviceData);

  let updatedCount = 0;
  let errorCount = 0;

  // Process devices in batches
  for (let i = 0; i < normalizedDevices.length; i += 10) {
    const batch = normalizedDevices.slice(i, i + 10);
    const batchNumber = Math.floor(i / 10) + 1;

    try {
      const { data, error } = await supabase
        .from('devices')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ Error importing devices batch ${batchNumber}:`, error);
        errorCount += batch.length;
      } else {
        updatedCount += batch.length;
        console.log(`✅ Devices batch ${batchNumber} processed successfully`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Exception in devices batch ${batchNumber}:`, error);
      errorCount += batch.length;
    }
  }

  return { updatedCount, errorCount };
}

// Main function
async function updateAllData() {
  try {
    console.log('🚀 Starting data update process...');

    // Normalize all customer data
    const normalizedCustomers = backupData.data.customers.map(normalizeCustomerData);
    console.log(`✅ Normalized ${normalizedCustomers.length} customers`);

    // Update customers in batches
    const customerResult = await updateCustomersInBatches(normalizedCustomers, 20);

    console.log('\n📊 Customer Update Summary:');
    console.log(`✅ Successfully updated: ${customerResult.updatedCount} customers`);
    console.log(`❌ Errors: ${customerResult.errorCount} customers`);
    
    if (customerResult.errors.length > 0) {
      console.log('\n❌ Customer Error Details:');
      customerResult.errors.forEach(error => {
        console.log(`  Batch ${error.batch}: ${error.error}`);
      });
    }

    // Import devices if available
    if (backupData.data.devices && backupData.data.devices.length > 0) {
      console.log('\n🔧 Starting device import...');
      const deviceResult = await importDevices(backupData.data.devices);
      
      console.log('\n📊 Device Import Summary:');
      console.log(`✅ Successfully imported: ${deviceResult.updatedCount} devices`);
      console.log(`❌ Errors: ${deviceResult.errorCount} devices`);
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { count: customerCount, error: customerCountError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { count: deviceCount, error: deviceCountError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    if (customerCountError) {
      console.error('❌ Error counting customers:', customerCountError);
    } else {
      console.log(`📈 Total customers in database after update: ${customerCount}`);
    }

    if (deviceCountError) {
      console.error('❌ Error counting devices:', deviceCountError);
    } else {
      console.log(`📈 Total devices in database after update: ${deviceCount}`);
    }

    console.log('\n🎉 Data update process completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateAllData(); 