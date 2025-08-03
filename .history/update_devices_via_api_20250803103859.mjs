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
console.log(`📈 Total devices in backup: ${backupData.data.devices.length}`);

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

// Function to update device using the API
async function updateDeviceViaAPI(device) {
  try {
    const { data, error } = await supabase
      .from('devices')
      .update({
        customer_id: device.customer_id,
        brand: device.brand,
        model: device.model,
        serial_number: device.serial_number,
        issue_description: device.issue_description,
        status: device.status,
        assigned_to: device.assigned_to,
        expected_return_date: device.expected_return_date,
        device_type: device.device_type,
        repair_cost: device.repair_cost,
        deposit_amount: device.deposit_amount,
        device_cost: device.device_cost,
        diagnosis_required: device.diagnosis_required,
        device_notes: device.device_notes,
        device_condition: device.device_condition,
        imei: device.imei,
        is_internal: device.is_internal,
        department: device.department,
        location: device.location,
        created_by: device.created_by,
        condition: device.condition,
        power_status: device.power_status,
        notes: device.notes,
        purchase_type: device.purchase_type,
        purchase_price: device.purchase_price,
        estimated_hours: device.estimated_hours,
        warranty_start: device.warranty_start,
        warranty_end: device.warranty_end,
        warranty_status: device.warranty_status,
        repair_count: device.repair_count,
        priority_level: device.priority_level,
        issue_type: device.issue_type,
        labor_cost: device.labor_cost,
        parts_cost: device.parts_cost,
        payment_status: device.payment_status,
        symptoms: device.symptoms,
        possible_causes: device.possible_causes,
        additional_notes: device.additional_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', device.id);

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to insert device using the API
async function insertDeviceViaAPI(device) {
  try {
    const { data, error } = await supabase
      .from('devices')
      .insert({
        id: device.id,
        customer_id: device.customer_id,
        brand: device.brand,
        model: device.model,
        serial_number: device.serial_number,
        issue_description: device.issue_description,
        status: device.status,
        assigned_to: device.assigned_to,
        expected_return_date: device.expected_return_date,
        device_type: device.device_type,
        repair_cost: device.repair_cost,
        deposit_amount: device.deposit_amount,
        device_cost: device.device_cost,
        diagnosis_required: device.diagnosis_required,
        device_notes: device.device_notes,
        device_condition: device.device_condition,
        imei: device.imei,
        is_internal: device.is_internal,
        department: device.department,
        location: device.location,
        created_by: device.created_by,
        condition: device.condition,
        power_status: device.power_status,
        notes: device.notes,
        purchase_type: device.purchase_type,
        purchase_price: device.purchase_price,
        estimated_hours: device.estimated_hours,
        warranty_start: device.warranty_start,
        warranty_end: device.warranty_end,
        warranty_status: device.warranty_status,
        repair_count: device.repair_count,
        priority_level: device.priority_level,
        issue_type: device.issue_type,
        labor_cost: device.labor_cost,
        parts_cost: device.parts_cost,
        payment_status: device.payment_status,
        symptoms: device.symptoms,
        possible_causes: device.possible_causes,
        additional_notes: device.additional_notes,
        created_at: device.created_at,
        updated_at: device.updated_at
      });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to update devices one by one
async function updateDevicesOneByOne(devices) {
  const totalDevices = devices.length;
  let updatedCount = 0;
  let insertedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalDevices} devices one by one`);

  for (let i = 0; i < totalDevices; i++) {
    const device = devices[i];
    const deviceNumber = i + 1;

    if (deviceNumber % 10 === 0) {
      console.log(`📦 Processing device ${deviceNumber}/${totalDevices}`);
    }

    try {
      // First try to check if device exists
      const { data: existingDevice, error: checkError } = await supabase
        .from('devices')
        .select('id')
        .eq('id', device.id)
        .single();

      let result;
      if (existingDevice) {
        // Update existing device
        result = await updateDeviceViaAPI(device);
        if (result.success) {
          updatedCount++;
        } else {
          errorCount++;
          errors.push({ device: deviceNumber, error: result.error });
        }
      } else {
        // Insert new device
        result = await insertDeviceViaAPI(device);
        if (result.success) {
          insertedCount++;
        } else {
          errorCount++;
          errors.push({ device: deviceNumber, error: result.error });
        }
      }

      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception updating device ${deviceNumber}:`, error);
      errorCount++;
      errors.push({ device: deviceNumber, error: error.message });
    }
  }

  return { updatedCount, insertedCount, errorCount, errors };
}

// Main function
async function updateAllDevices() {
  try {
    console.log('🚀 Starting device update process...');

    // Normalize all device data
    const normalizedDevices = backupData.data.devices.map(normalizeDeviceData);
    console.log(`✅ Normalized ${normalizedDevices.length} devices`);

    // Update devices one by one
    const result = await updateDevicesOneByOne(normalizedDevices);

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} devices`);
    console.log(`✅ Successfully inserted: ${result.insertedCount} devices`);
    console.log(`❌ Errors: ${result.errorCount} devices`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details (first 10):');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  Device ${error.device}: ${error.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const { count, error: countError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting devices:', countError);
    } else {
      console.log(`📈 Total devices in database after update: ${count}`);
    }

    console.log('\n🎉 Device update process completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateAllDevices(); 